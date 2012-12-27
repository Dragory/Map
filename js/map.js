var Map = function(containerElem, mapParts, initialSizeFactor) {
    if (initialSizeFactor == undefined) initialSizeFactor = 1;

    // Our elements. Null by default.
    this.$viewport  = null;
    this.$container = null;

    // Default map size.
    // To-do: move this to the Map arguements
    // or check it dynamically.
    this.defaultSize = {
        'x': 800 * initialSizeFactor,
        'y': 800 * initialSizeFactor
    };

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
    this.buildMap(mapParts, initialSizeFactor);
};

// Initialize the map
Map.prototype.init = function(containerElem) {
    // Create the main structure
    var $elem = $(containerElem);

    this.$viewport = $('<div></div>');
    this.$viewport.addClass('map-viewport');

    this.$container = $('<div></div>');
    this.$container.addClass('map-container');

    this.$viewport.append(this.$container);
    $elem.append(this.$viewport);

    // Bindings
    var self = this;

    // Zooming
    this.$viewport.on('mousewheel', function(ev, delta, deltaX, deltaY) {
        console.log('WHEEL');
        if (deltaY > 0)
        {
            self.zoom(mouseX, mouseY, 1.5);
        }
        else
        {
            self.zoom(mouseX, mouseY, 0.5);
        }
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

// Build the map elements/part inside the map container
Map.prototype.buildMap = function(parts, initialSizeFactor) {
    // To-do: loop through the elements instead of using just the first one
    var $mapPart = $('<img>');
    $mapPart.attr({
        'src': parts[0]
    });
    $mapPart.css({
        'width': '100%'
    });

    this.$container.append($mapPart);

    // Set the initial zoom
    this.$container.width(this.defaultSize.x);
    this.$container.height(this.defaultSize.y);

    // Disable the browser's own dragging implementation on the map's images
    this.$container.children('img').on('dragstart', function() { return false; });
};

// Clamps the container's borders so that there shouldn't
// be any white/empty space around it. Given x and y coordinates
// should be the container's position (usually to-be position, such as
// when zooming or panning). Returns an object containing the clamped
// coordinates.
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
        y = -1 * (sizes.containerY - sizes.viewportY);

    return {
        'x': x,
        'y': y
    };
};

/**
 * ZOOMING
 */

Map.prototype.zoom = function(x, y, factor) {
    console.log('ZOOM');

    // Position on the viewport
    var posViewport  = {'x': x, 'y': y};

    // Position in the map container
    var containerPosition = this.$container.position();
    var posContainer = {
        'x': posViewport.x - containerPosition.left,
        'y': posViewport.y - containerPosition.top
    };

    // Positions in percents
    posViewport.xP = (posViewport.x/this.$viewport.width());  // X % in viewport
    posViewport.yP = (posViewport.y/this.$viewport.height()); // Y % in viewport

    posContainer.xP = (posContainer.x/this.$container.width());  // X % in the container
    posContainer.yP = (posContainer.y/this.$container.height()); // Y % in the container

    // Zooming.
    // Go through each element in the map container
    // and size them accordingly (directly or via an animation).
    var newContainerSize = {
        'x': this.$container.width() * factor,
        'y': this.$container.height() * factor
    };

    // Make sure the map's not going to be too small
    if (newContainerSize.x < this.$viewport.width() || newContainerSize.y < this.$viewport.height())
    {
        // Ratios
        var XtoY = newContainerSize.x/newContainerSize.y;
        var YtoX = 1/XtoY;

        // Scale by the shorter side/axis
        if (newContainerSize.x < newContainerSize.y)
        {
            newContainerSize.x = this.$viewport.width();
            newContainerSize.y = newContainerSize.x * YtoX;
        }
        else
        {
            newContainerSize.y = this.$viewport.height();
            newContainerSize.x = newContainerSize.y * XtoY;
        }
    }

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
    // "current" size (as the container has not been resized yet
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
    this.$container.stop(true, true).animate({
        'width': newContainerSize.x,
        'height': newContainerSize.y,

        'left': newContainerOffset.x,
        'top': newContainerOffset.y
    }, 100);
};

/**
 * PANNING
 */

Map.prototype.startPan = function() {
    var containerPosition = this.$container.position();
    this.panData.startContainerX = containerPosition.left;
    this.panData.startContainerY = containerPosition.top;

    this.panData.startPointerX = mouseX;
    this.panData.startPointerY = mouseY;

    this.panning = true;
};

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

Map.prototype.endPan = function() {
    this.panning = false;
};