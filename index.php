<?php
    header('Content-Type: text/html; charset=UTF-8');
?>
<!doctype html>
<html>
<head>
    <meta charset="UTF-8">

    <title>Map</title>

    <link rel="stylesheet" type="text/css" href="css/map.css">
</head>
<body>
    <div id="map"></div>

    <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>
    <script type="text/javascript" src="js/jquery.mousewheel.js"></script>
    <script type="text/javascript" src="js/mouse.js"></script>
    <script type="text/javascript" src="js/map.js"></script>
    <script type="text/javascript">
        $(document).ready(function() {
            var $mapElem = $('#map');
            var map = new Map($mapElem),
                [
                    'images/mapparts/map.jpg'
                ]
            );
        });
    </script>
</body>
</html>