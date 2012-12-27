var Map = function(containerElem, mapParts) {
    this.$viewport  = null;
    this.$container = null;

    this.init(containerElem);
    this.buildMap(mapParts);
};

// Initialize the map
Map.prototype.init = function(containerElem) {
    var $elem = $(containerElem);

    this.$viewport = $('<div></div>');
    this.$viewport.addClass('map-viewport');

    this.$container = $('<div></div>');
    this.$container.addClass('map-container');

    this.$viewport.append(this.$container);
    $elem.append(this.$viewport);

    var $testLink = $('<a></a>');
    $testLink.attr({'href': 'javascript:void(0);'});
    $testLink.text('Test');

    var self = this;
    this.$viewport.on('mousewheel', function(ev, delta, deltaX, deltaY) {
        if (deltaY > 0)
        {
            self.zoom(mouseX, mouseY, 1.5);
        }
        else
        {
            self.zoom(mouseX, mouseY, 0.5);
        }
    });

    $elem.append($testLink);
};

// Build the map elements inside the map container
Map.prototype.buildMap = function(parts) {
    var $mapPart = $('<img>');
    $mapPart.attr({
        'src': parts[0]
    });
    $mapPart.css({
        'width': '100%'
    });

    this.$container.append($mapPart);
};

// Zooming
Map.prototype.zoom = function(x, y, factor) {
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

    // Now move and resize the map (directly or via an animation).
    this.$container.stop(true, true).animate({
        'width': newContainerSize.x,
        'height': newContainerSize.y,

        'left': newContainerOffset.x,
        'top': newContainerOffset.y
    }, 100);
};