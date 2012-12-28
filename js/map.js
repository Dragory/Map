var Map = function(containerElem, mapParts, userSettings) {
    // Default settings
    this.settings = {
        // The ratio of the map container's
        // width to the container's height.
        // This is needed as a setting because we
        // don't know the container's ratios before
        // everything in it has loaded. We could wait
        // for the content to load, but apparently
        // the load event is a bit unreliable, so let's
        // go with this for now.
        'XtoY': 1,

        // Zoom values.
        // These values are proportional to the viewport's
        // size, so "1" with a 800x800 viewport would mean
        // the map at 800x800 (or with a larger value on one
        // side in case the edge lengths aren't equal).
        'maxZoom':     4,
        'minZoom':     1,
        'initialZoom': 1
    };

    // Override default settings if any are supplied
    if (userSettings == undefined) userSettings = {};
    for (var i in userSettings) this.settings[i] = userSettings[i];

    // Calculate the height's ratio to the width
    this.settings.YtoX = 1/this.settings.XtoY;

    // Set our zoom factor
    this.zoomFactor = 0;

    // Our elements. Null by default.
    this.$viewport  = null;
    this.$container = null;

    // Variables for panning
    this.panning = false;
    this.panData = {
        'startContainerX': 0, // The container's "left" property when we start panning
        'startContainerY': 0, // The container's "top" property when we start panning

        'startPointerX': 0, // Mouse/touch X when we start panning
        'startPointerY': 0  // Mouse/touch Y when we start panning
    };

    // Start building our map
    this.init(containerElem);
    this.buildMap(mapParts, this.settings.initialZoom);

    // Monitor the viewport size for changes
    // and fix the container's size if needed.
    var prevViewportSize = {
        'x': this.$viewport.width(),
        'y': this.$viewport.height()
    };

    var self = this;
    setInterval(function() {
        if (self.$viewport.width() != prevViewportSize.x || self.$viewport.height() != prevViewportSize.y)
        {
            self.fixContainerSize();
            prevViewportSize.x = self.$viewport.width();
            prevViewportSize.y = self.$viewport.height();
        }
    }, 500);
};

/**
 * Initializes the map.
 * @param  {element} containerElem The element we're creating our map into.
 * @return {none}
 */
Map.prototype.init = function(containerElem) {
    // Create the main structure
    var $elem = $(containerElem);

    // Create the viewport
    this.$viewport = $('<div></div>');
    this.$viewport.addClass('map-viewport');

    // Create the container
    this.$container = $('<div></div>');
    this.$container.addClass('map-container');

    // Append the elements
    this.$viewport.append(this.$container);
    $elem.append(this.$viewport);

    // Bindings
    var self = this;

    // Zooming
    this.$viewport.on('mousewheel', function(ev, delta, deltaX, deltaY) {
        var viewportPosition = self.$viewport.offset();
        var posInViewport = {
            'x': mouseX - viewportPosition.left,
            'y': mouseY - viewportPosition.top
        };

        if (deltaY > 0)
        {
            self.zoom(posInViewport.x, posInViewport.y, 1.5);
        }
        else
        {
            self.zoom(posInViewport.x, posInViewport.y, 0.5);
        }

        ev.preventDefault();
        return false;
    });

    // Panning
    this.$viewport.on({
        'mousedown': function(ev) {
            self.startPan();
        },
        'mouseup': function(ev) {
            if (self.panning) self.endPan();
        },
        'mouseleave': function(ev) {
            if (self.panning) self.endPan();
        },
        'mousemove': function(ev) {
            if (self.panning) self.panLoop();
        }
    });
};

/**
 * Builds the map from the given parts.
 * Heavily WIP.
 * @param  {array} parts       An array of the map's parts.
 * @param  {int}   initialZoom The initial zoom level. More info above.
 * @return {none}
 */
Map.prototype.buildMap = function(parts, initialZoom) {
    // To-do: loop through the elements instead of using just the first one
    var $mapPart = $('<img>');
    $mapPart.attr({
        'src': parts[0]
    });
    $mapPart.css({
        'width': '100%'
    });

    /*var $mapPart = $('<div></div>');
    $mapPart.css({
        'width': '100%',
        'height': '100%',
        'background': 'url('+parts[0]+') no-repeat 100% 100%'
    });*/

    this.$container.append($mapPart);

    // Set the initial zoom
    this.zoom(0, 0, initialZoom, 0);

    // Disable the browser's own dragging implementation on the map's images
    this.$container.children('img').on('dragstart', function() { return false; });
};

// Some helpers
Map.prototype.containerLeft = function() {
    return this.$container.position().left;
};
Map.prototype.containerTop = function() {
    return this.$container.position().top;
};
Map.prototype.containerRight = function(width) {
    return this.$container.position().left + (width ? width : this.$container.width());
};
Map.prototype.containerBottom = function(height) {
    return this.$container.position().top + (height ? height : this.$container.height());
};

/**
 * Clamps the container's to-be borders to be within the viewport.
 * Should usually be used soon after clampContainerSize.
 * You can also give this function "to-be" sizes for the container
 * so that you don't need to resize the container before calculating
 * the clamped coordinates when e.g. zooming.
 * @param  {int}    x     The container's to-be X coordinate
 * @param  {int}    y     The container's to-be Y coordinate
 * @param  {object} sizes The container's and/or viewports width and/or height
 * @return {object}       Contains the new, clamped X and Y coordinates
 */
Map.prototype.clampContainerBorders = function(x, y, sizes) {
    if (sizes == undefined) sizes = {};

    // Sizes needed for adjusting the container
    // to stay within the edges of the map.
    var defaultSizes = {
        'containerX': this.$container.width(),
        'containerY': this.$container.height(),

        'viewportX': this.$viewport.width(),
        'viewportY': this.$viewport.height(),
    };

    for (var i in defaultSizes)
    {
        if (sizes[i] == undefined) sizes[i] = defaultSizes[i];
    }

    // Make sure we don't go over the edges
    if (x > 0) x = 0;
    if (y > 0) y = 0;

    // x - sizes.viewportX = The right edge of the container, inverted
    // -1 * that = The "correct" right edge of the container
    if (-1 * (x - sizes.viewportX) > sizes.containerX) // If we're over the right edge,
        x = -1 * (sizes.containerX - sizes.viewportX); // "clamp" the container to the right edge

    // Same logic as above but for the bottom edge of the map
    if (-1 * (y - sizes.viewportY) > sizes.containerY)
    {
        y = -1 * (sizes.containerY - sizes.viewportY);
        // console.log([sizes.containerY, sizes.viewportY, -1 * (y - sizes.viewportY), -1 * (sizes.containerY - sizes.viewportY)].join(', '));
    }

    return {
        'x': x,
        'y': y
    };
};

/**
 * Clamps the given size so that it won't
 * become smaller than the viewport.
 * @param  {int}      x The length along the X axis (width)
 * @param  {int}      y The length along the Y axis (height)
 * @return {object}   The new, clamped width and height
 */
Map.prototype.clampContainerSize = function(x, y) {
    // return {'x': x, 'y': y};
    var XtoY = x/y;
    var YtoX = 1/XtoY;

    // If the container's not wide enough
    if (x < this.$viewport.width())
    {
        x = this.$viewport.width();
        y = x * YtoX;
    }

    // (And) if it's not high enough
    if (y < this.$viewport.height())
    {
        y = this.$viewport.height();
        x = y * XtoY;
    }

    return {
        'x': x,
        'y': y
    };
};

/**
 * Zooms the map.
 * @param  {int}   x              The X coordinate where we're zooming.
 * @param  {int}   y              The Y coordinate where we're zooming.
 * @param  {float} factor         The zoom factor (or "amount").
 * @param  {int}   animationSpeed The speed of the zooming animation. 0 for instant. Default 100.
 * @return {none}
 */
Map.prototype.zoom = function(x, y, factor, animationSpeed) {
    if (animationSpeed == undefined) animationSpeed = 100;

    // Clamp the resulting zoom factor.
    var resultZoomFactor = (this.zoomFactor > 0 ? this.zoomFactor * factor : factor);
    if (resultZoomFactor > this.settings.maxZoom) resultZoomFactor = this.settings.maxZoom;
    if (resultZoomFactor < this.settings.minZoom) resultZoomFactor = this.settings.minZoom;

    // If the zoom level didn't change, don't continue zooming
    // if (resultZoomFactor == this.zoomFactor) return;

    // Pointer's position on the viewport
    var posViewport  = {'x': x, 'y': y};

    // Pointer's position in the map container
    var containerPosition = this.$container.position();
    var posContainer = {
        'x': posViewport.x - containerPosition.left,
        'y': posViewport.y - containerPosition.top
    };

    // Above positions in percentages
    posViewport.xP = (posViewport.x/this.$viewport.width());  // X % in viewport
    posViewport.yP = (posViewport.y/this.$viewport.height()); // Y % in viewport

    posContainer.xP = (posContainer.x/this.$container.width());  // X % in the container
    posContainer.yP = (posContainer.y/this.$container.height()); // Y % in the container

    // Scale the container. The containing map
    // elements should scale accordingly via
    // e.g. percentage widths.
    // 
    // Like mentioned above with the zoom settings,
    // the container size is proportional to the
    // viewport's size.
    // 
    // The shorter side is scaled (and the other one in the correct ratio)
    // and then the map's size is clamped so that it's not smaller than the viewport.
    var newContainerSize = {};
    newContainerSize.x = this.$viewport.width() * resultZoomFactor;
    newContainerSize.y = newContainerSize.x * this.settings.YtoX;

    // Make sure the map's not going to be too small
    newContainerSize = this.clampContainerSize(newContainerSize.x, newContainerSize.y);

    // Now move the map to the correct position

    // First according to the mouse's position in the container
    // Calculate the "distance" to the mouse's position (using the percentage) and invert
    // that to move the map so, that the viewport's left top corner is where the mouse
    // was before zooming.
    var newContainerOffset = {
        'x': -1 * (posContainer.xP * newContainerSize.x),
        'y': -1 * (posContainer.yP * newContainerSize.y)
    };

    // Then according to the mouse's position in the viewport so,
    // that the area of the map we were hovering over is still
    // under the mouse after zooming.
    // Same logic with the calculations here as above.
    newContainerOffset.x += (posViewport.xP * this.$viewport.width());
    newContainerOffset.y += (posViewport.yP * this.$viewport.height());

    // Clamp the container's position
    // Remember to supply the third parameter, as the clamping
    // should be done according to the new, zoomed size, not the
    // "current" size (as the container has not yet been resized
    // at this point).
    newContainerOffset = this.clampContainerBorders(
        newContainerOffset.x,
        newContainerOffset.y,
        {
            'containerX': newContainerSize.x,
            'containerY': newContainerSize.y
        }
    );

    // Now move and resize the map (directly or via an animation).
    if (animationSpeed > 0)
    {
        this.$container.stop(true, true).animate({
            'width': newContainerSize.x,
            'height': newContainerSize.y,

            'left': newContainerOffset.x,
            'top': newContainerOffset.y
        }, animationSpeed);
    }
    else
    {
        this.$container.stop(true, true).css({
            'width': newContainerSize.x,
            'height': newContainerSize.y,

            'left': newContainerOffset.x,
            'top': newContainerOffset.y
        });
    }

    // Save the current zoom level
    this.zoomFactor = resultZoomFactor;
};

/**
 * Starts panning by setting some initial values.
 * @return {none}
 */
Map.prototype.startPan = function() {
    var containerPosition = this.$container.position();
    this.panData.startContainerX = containerPosition.left;
    this.panData.startContainerY = containerPosition.top;

    this.panData.startPointerX = mouseX;
    this.panData.startPointerY = mouseY;

    this.panning = true;
};

/**
 * Pans the map according to the pointer's location
 * and the values provided by startPan.
 * @return {none}
 */
Map.prototype.panLoop = function() {
    // How much we've moved our pointer
    var moved = {
        'x': mouseX - this.panData.startPointerX,
        'y': mouseY - this.panData.startPointerY
    };

    // The new position for the map container
    var newContainerPosition = {
        'x': this.panData.startContainerX + moved.x,
        'y': this.panData.startContainerY + moved.y
    };

    newContainerPosition = this.clampContainerBorders(newContainerPosition.x, newContainerPosition.y);

    // Set the pan position
    this.$container.css({
        'left': newContainerPosition.x,
        'top': newContainerPosition.y
    });
};

/**
 * Stops panning by setting the "panning"
 * boolean to false.
 * @return {none}
 */
Map.prototype.endPan = function() {
    this.panning = false;
};

Map.prototype.fixContainerSize = function() {
    console.log('CHANGED');

    var containerSize = this.clampContainerSize(this.$container.width(), this.$container.height());
    this.$container.css({
        'width': containerSize.x,
        'height': containerSize.y
    });

    var containerPos = this.clampContainerBorders(this.$container.width(), this.$container.height());
    this.$container.css({
        'left': containerPos.x,
        'top': containerPos.y
    });
};