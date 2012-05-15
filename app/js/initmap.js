var routePoints = [];
function initialize() {

  var myOptions = {
    center: new google.maps.LatLng(-39.954700469970703, 176.01788520812988),
    zoom: 8,
    mapTypeId: google.maps.MapTypeId.SATELLITE
  };

  var map = new google.maps.Map(document.getElementById("map_canvas"),  myOptions);

  google.maps.event.addListener(map, 'click', function(event) {
    placeMarker(map, routePoints, event.latLng);
  });
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

function placeMarker(m, routePoints, location) {
  var marker;
  var map = m;
  console.log(location);

  if (marker) {
    marker.setPosition(location);
  } else {
    marker = new google.maps.Marker({
      position: location,
      draggable: true,
      title: 'Drag me',
      map: map
    });

    $.ajax({
      type: "GET",
      url: "newpoint/"+JSON.stringify({
        lat: location.lat(),
        lng: location.lng()
      }),
      dataType: "html",
      success: function(html) {
        var infowindow = new google.maps.InfoWindow({
           content: html
           , position: location
        });
        infowindow.open(map);
        setSlider(1);
      }
    });


    routePoints.push(marker); // to be used later to clea overlay array

    showRebusForm();
  }
}

// Removes the overlays from the map, but keeps them in the array
function clearOverlays() {
  if (routePoints) {
    for (var i = 0, length = routePoints.length; i < length; i++) {
      routePoints[i].setMap(null);
    }
  }
}

function showRebusForm() {
  $('#new_rebus_form').show();
}
