var mouseX = 0;
var mouseY = 0;

function trackMouse(ev)
{
    mouseX = ev.pageX;
    mouseY = ev.pageY;
}

$(document).mousemove(trackMouse);