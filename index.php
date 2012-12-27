<?php
    header('Content-Type: text/html; charset=UTF-8');
?>
<!doctype html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">

    <title>Map test</title>

    <link rel="stylesheet" type="text/css" href="css/map.css">
</head>
<body>
    <div id="map"></div>
    <!--<div id="map-viewport">
        <div id="map-container">
            <img src="images/mapparts/map.jpg" alt="MAP" style="width: 800px">
        </div>
    </div>-->

    <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>
    <script type="text/javascript" src="js/jquery.mousewheel.js"></script>
    <script type="text/javascript" src="js/mouse.js"></script>
    <script type="text/javascript" src="js/map.js"></script>
    <script type="text/javascript">
        $(document).ready(function() {
            var map = new Map($('#map'),
            [
                'images/mapparts/map.jpg'
            ]);
        });
    </script>
</body>
</html>