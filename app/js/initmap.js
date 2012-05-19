var routePoints = {};
var map;

function initialize() {
  if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      prepMap(position.coords.latitude, position.coords.longitude);
    });
  } else {
    prepMap(-39.954700469970703, 176.01788520812988);
  }
  prepStartPicker();

  window.onbeforeunload = function() {
    return "Leaving the page will result in losing all changes!";
  }
}

function prepStartPicker() {
  $('#contest_end').datepicker({
      duration: ''
    , showTime: true
    , constrainInput: false
    , stepMinutes: 1
    , stepHours: 1
    , altTimeField: ''
    , time24h: true
  });
  $('#contest_start').datepicker({
      duration: ''
    , showTime: true
    , constrainInput: false
    , stepMinutes: 1
    , stepHours: 1
    , altTimeField: ''
    , time24h: true
  });
}

function prepMap(lat,lng) {
  var myOptions = {
      center: new google.maps.LatLng(lat, lng)
    , zoom: 16
    , mapTypeId: google.maps.MapTypeId.SATELLITE
  };

  map = new google.maps.Map(document.getElementById("map_canvas"),  myOptions);

  google.maps.event.addListener(map, 'click', function(event) {
    placeMarker(event.latLng);
  });
}

function setRebus(location) {
  var geocoder = new google.maps.Geocoder();
  geocoder.geocode({ 'latLng': location  }, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
          name = results[1].address_components[0].long_name;
          $("#contest_location").val(name);
          $("#contest_name").val(name + " Rebus Run");
          $("label.private").show();
          $("#hideAll").show();

//          $.each(routePoints, function(id, point) {
//            console.log(id);
//          });
      }
  });
}

function placeMarker(location) {
  if ($('div.newcontest').length<1); else {
    $('div.newcontest').remove();
    setRebus(location);
  }

  var id;
  var marker;
//  console.log(location);

  if (marker) {
    marker.setPosition(location);
  } else {

    $.ajax({
      url: pointPath(location),
      success: function(html) {
        id = $(html).filter('form').attr('id').slice(6);
        $("#contest_count").val(id);

        hidePrevious(id);

        // Create marker
        marker = new google.maps.Marker({
            position: location
          , draggable: true
          , title: 'Drag me'
          , map: map
        });

        // Add radius
        circle = new google.maps.Circle({
            map: map
          , radius: 30 // 3000 km
        });
        circle.bindTo('center', marker, 'position');

        // Add rebus infowindow
        infowindow = new google.maps.InfoWindow({
          content: html
        });
        google.maps.event.addListener(infowindow,'closeclick',function(){
          closeWindow(id);
        });
        infowindow.open(map, marker);

        // Store route point
        routePoints[id] = [
            marker
          , circle
          , infowindow
        ];

        // Toggle infowindow  by marker click
        google.maps.event.addListener(marker, "click", function() {
          toggleInfo(id);
        });

      }
    });

    $('#new_contest_row').show();
  }
}

function closeWindow(id) {
  if (routePoints[id][2].map == null); else {
    setPoint(id); // save point before close
    routePoints[id][2].close();
  }
}

function openWindow(id) {
  getPoint(id); // update infowindow
  routePoints[id][2].open(map, routePoints[id][0]);
}

function toggleInfo(id) {
  if (routePoints[id][2].map == null) {
    openWindow(id);
  } else {
    closeWindow(id);
  }
}

function toggleAllInfo(open) {
  $.each(routePoints, function(id, point) {
    if (open) openWindow(id);
    else closeWindow(id);
  });
  $("#hideAll").toggle();
  $("#showAll").toggle();
}

function hidePrevious(id) {
  prev = parseInt(id) - 1;
  if (typeof routePoints[prev] === "undefined");
  else { closeWindow(prev); }
}

function pointPath(location) {
  return "points/new/"+JSON.stringify({
    lat: location.lat(),
    lng: location.lng()
  })
}

// Switch position with the point of next order
function switchPos(id, order) {
  ths = $("#rebus-"+id);
  thsNo = ths.find("span.order").html();
  thsId = ths.attr("id");

  nxtNo = parseInt(thsNo) + order;
  nxt = $(".rebus-no-"+nxtNo);
  nxtId = nxt.attr("id");
  nxt = $("#"+nxtId);

  if (typeof nxtId === "undefined"); else {
    ths.attr("class", "rebus-form rebus-no-"+nxtNo)
    ths.find("span.order").html(nxtNo);
    nxt.attr("class", "rebus-form rebus-no-"+thsNo)
    nxt.find("span.order").html(thsNo);
  }
}

function changeRadius(id, range) {
  var circle = routePoints[id][1];
  circle.setRadius(parseInt(range));
}

function setPoint(id) {
  ths = $("#rebus-"+id);
  newpoint = {
    point: {
      order: ths.find("span.order").html()
    , rebus: ths.find("textarea").val()
    , lat:   routePoints[id][0].position.lat()
    , lng:   routePoints[id][0].position.lng()
    , range: ths.find("input.range").val()
    }
  }
  $.post("/points/"+id, newpoint);
}

function getPoint(id) {
  $.get("/points/"+id, function(html) {
    routePoints[id][2].setContent(html);
  });
}

// Reset the page, create a new contest.
function newContest() {
  routePoints = {};
  $.get("/new");
  initialize();
}

// Save the current contest to the database
function saveContest() {
  if ($('div.newcontest').length>0) $('.newcontest').show();
  else {
    toggleAllInfo(true); // Make sure all points are open
    toggleAllInfo(false); // Close and save all points
    f = $("form#new_contest_form");
    contest = {
        name: f.find("#contest_name").val()
      , location: f.find("#contest_location").val()
      , start: f.find("#contest_start").val()
      , end: f.find("#contest_end").val()
    }

    // If empty values in any field
    if ($.inArray("", [contest.end, contest,name, contest.location, contest.start]) == 0) {
      $('.alert-error').html("<b>Error!</b> You have to fill in all fields before you can save.");
      $('.alert-error').show();
    } else {
      $('.alert-error').hide();
      $.post("/save", { contest: contest }, function(data) {
        console.log(data);
      });
    }
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

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};
