<script>
  import mapboxgl from 'mapbox-gl';
  import 'mapbox-gl/dist/mapbox-gl.css';
  import * as d3 from 'd3';
  import { onMount } from 'svelte';

  // Replace this with your Mapbox token
  mapboxgl.accessToken = 'pk.eyJ1IjoiYmR1b3RvIiwiYSI6ImNtM3RkcnlyZzA3N2oybHBqc2VtbGYyNmkifQ.uh5QL5-LtVnRyP_BXU85cQ';

  let map;
  let stations = [];
  let trips = [];
  let timeFilter = -1;
  let filteredTrips = [];
  let radiusScale;
  let stationFlow;

  // Fetch station and trip data
  const fetchStations = async () => {
    stations = await d3.csv('https://vis-society.github.io/labs/8/data/bluebikes-stations.csv');
  };

  const fetchTrips = async () => {
    trips = await d3.csv('https://vis-society.github.io/labs/8/data/bluebikes-traffic-2024-03.csv');
  };

  // Function to calculate filtered trips
  const filterTripsByTime = () => {
    filteredTrips =
      timeFilter === -1
        ? trips
        : trips.filter((trip) => {
            const minutesSinceMidnight = (date) => new Date(date).getHours() * 60 + new Date(date).getMinutes();
            const startMinutes = minutesSinceMidnight(trip.started_at);
            const endMinutes = minutesSinceMidnight(trip.ended_at);
            return (
              Math.abs(startMinutes - timeFilter) <= 60 ||
              Math.abs(endMinutes - timeFilter) <= 60
            );
          });
  };

  // On mount, initialize the map
  onMount(async () => {
    await fetchStations();
    await fetchTrips();

    map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-71.0589, 42.3601],
      zoom: 12,
    });

    map.on('load', () => {
      // Add Boston bike lanes
      map.addSource('boston_bike_lanes', {
        type: 'geojson',
        data: 'https://bostonopendata-boston.opendata.arcgis.com/.../boston-bike-lanes.geojson', // Replace with actual Boston bike lanes GeoJSON URL
      });

      map.addLayer({
        id: 'boston_bike_lanes',
        type: 'line',
        source: 'boston_bike_lanes',
        paint: {
          'line-color': 'green',
          'line-width': 2,
          'line-opacity': 0.6,
        },
      });

      // Add BlueBike stations
      stations.forEach((station) => {
        const el = document.createElement('div');
        el.className = 'marker';

        new mapboxgl.Marker(el)
          .setLngLat([+station.Long, +station.Lat])
          .addTo(map);
      });
    });

    // Reactive variables for scaling and traffic flow
    $: radiusScale = d3
      .scaleSqrt()
      .domain([0, d3.max(stations, (d) => d.totalTraffic)])
      .range([3, 25]);

    $: stationFlow = d3
      .scaleQuantize()
      .domain([0, 1])
      .range(['#FF4500', '#FFFF00', '#32CD32']); // Departures, Balanced, Arrivals

    // Filter trips by time on slider change
    $: filterTripsByTime();
  });
</script>

<style>
  #map {
    width: 100%;
    height: 80vh;
  }
  .marker {
    background-color: steelblue;
    border-radius: 50%;
    width: 10px;
    height: 10px;
    opacity: 0.8;
  }
  .legend {
    display: flex;
    justify-content: space-between;
    padding: 1em;
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    margin: 1em 0;
  }
  .legend div {
    flex: 1;
    text-align: center;
  }
</style>

<div>
  <h1>Boston Bike Tracker</h1>
  <header>
    <label>
      Filter by time:
      <input type="range" min="-1" max="1440" bind:value={timeFilter} />
    </label>
    <time>{timeFilter === -1 ? 'Any Time' : new Date(0, 0, 0, 0, timeFilter).toLocaleTimeString()}</time>
  </header>

  <div id="map"></div>

  <div class="legend">
    <div style="color: #FF4500;">More Departures</div>
    <div style="color: #FFFF00;">Balanced</div>
    <div style="color: #32CD32;">More Arrivals</div>
  </div>
</div>
