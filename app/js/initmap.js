var routePoints = {};

function initialize() {

  var myOptions = {
    center: new google.maps.LatLng(-39.954700469970703, 176.01788520812988),
    zoom: 16,
    mapTypeId: google.maps.MapTypeId.SATELLITE
  };

  var map = new google.maps.Map(document.getElementById("map_canvas"),  myOptions);

  google.maps.event.addListener(map, 'click', function(event) {
    placeMarker(map, event.latLng);
  });
}

function placeMarker(m, location) {
  var id;
  var marker;
  var map = m;
//  console.log(location);

  if (marker) {
    marker.setPosition(location);
  } else {

    $.ajax({
      type: "GET",
      url: "newpoint/"+JSON.stringify({
        lat: location.lat(),
        lng: location.lng()
      }),
      dataType: "html",
      success: function(html) {
        id = $(html).filter('form').attr('id').slice(6);

        marker = new google.maps.Marker({
            position: location
          , draggable: true
          , title: 'Drag me'
          , map: map
        });

        circle = new google.maps.Circle({
            map: map
          , radius: 30 // 3000 km
        });
        circle.bindTo('center', marker, 'position');

        infowindow = new google.maps.InfoWindow({
          content: html
        });
        infowindow.open(map, marker);

//        console.log(id);

        routePoints[id] = [
            marker
          , circle
          , infowindow
        ];
      }
    });

    $('#new_rebus_form').show();
  }
}

function mama(id, range) {
  console.log(routePoints);
//  var circle = routePoints[id][1];
//  circle.setRadius(100);
}

// Removes the overlays from the map, but keeps them in the array
function clearOverlays() {
  if (routePoints) {
    for (var i = 0, length = routePoints.length; i < length; i++) {
      routePoints[i].setMap(null);
    }
  }
}

function loadGPX() {
  $.ajax({
    type: "GET",
    url: "gpx",
    dataType: "xml",
    success: function(xml) {
      var points = [];
      var bounds = new google.maps.LatLngBounds ();
      $(xml).find("trkpt").each(function() {
        var lat = $(this).attr("lat");
        var lon = $(this).attr("lon");
        var p = new google.maps.LatLng(lat, lon);
        points.push(p);
        bounds.extend(p);

        var marker = new google.maps.Marker({
          position: p,
          map: map
        });

        marker.setMap(map);

        google.maps.event.addListener(marker, "click", function() {
          var infowindow = new google.maps.InfoBox({
            content: "<img src='/png/128x128/<%= image %>' />"
            , position: p
            , minHeight: '400px'
          });
          infowindow.open(map);
        });

      });

      var poly = new google.maps.Polyline({
        // use your own style here
        path: points,
        strokeColor: "#FF00AA",
        strokeOpacity: .7,
        strokeWeight: 4
      });

      poly.setMap(map);

      // fit bounds to track
      map.fitBounds(bounds);
    }
  });
}
