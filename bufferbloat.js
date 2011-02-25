$(document).ready(function() {
    var canvasElement = document.createElement('canvas');
    $(canvasElement).attr('width',600).attr('height',400);
    $(canvasElement).attr('data-processing-sources','./bufferbloat.pde');
    $(canvasElement).appendTo('#animation');
});
