import type { StyleSpecification } from "mapbox-gl";

// Color palettes extracted from Apple Maps screenshots
const lightColors = {
  // Base
  land: "#ECECF4",
  water: "#A4DAF4",

  // Nature
  park: "#ADEBAD",
  cemetery: "#D1F0D1",
  forest: "#ADEBAD",
  marsh: "#C0D8B8",
  beach: "#F5E8A0",

  // Infrastructure
  airport: "#e3e3f7",
  airportRunway: "#e0e0f5",
  building: "#E4E0EC",
  buildingOutline: "#D0CCD8",

  // Roads
  roadFill: "#FFFFFF",
  roadCasing: "#D0D0D0",
  highwayFill: "#D0D0D0",
  highwayCasing: "#FFFFFF",
  motorwayFill: "#D0D0D0",
  motorwayCasing: "#FFFFFF",

  // Transit
  rail: "#5078A8",
  bikeLane: "#4CAF50",

  // Boundaries
  adminBorder: "#888888",
  stateBorder: "#888888",

  // Labels
  labelPrimary: "#333333",
  labelSecondary: "#666666",
  labelTertiary: "#888888",
  labelHalo: "#FFFFFF",
  labelGreen: "#3D8C40",

  // POI
  poiBackground: "#5078C8",
  poiIcon: "#FFFFFF",
};

const darkColors = {
  // Base
  land: "#2A313D",
  water: "#123448",

  // Nature
  park: "#1D554F",
  cemetery: "#224440",
  forest: "#1E544E",
  marsh: "#1A3830",
  beach: "#7A6850",

  // Infrastructure
  airport: "#2d313d",
  airportRunway: "#353741",
  building: "#1E2838",
  buildingOutline: "#2A3848",

  // Roads
  roadFill: "#3A4A5A",
  roadCasing: "#1A2430",
  highwayFill: "#4A5A6A",
  highwayCasing: "#2A3A4A",
  motorwayFill: "#4A5A6A",
  motorwayCasing: "#2A3A4A",

  // Transit
  rail: "#5888B8",
  bikeLane: "#4CAF50",

  // Boundaries
  adminBorder: "#C8C8C8",
  stateBorder: "#C8C8C8",

  // Labels
  labelPrimary: "#E8E8E8",
  labelSecondary: "#B0B0B0",
  labelTertiary: "#808080",
  labelHalo: "#2A313D",
  labelGreen: "#7AC47D",

  // POI
  poiBackground: "#5078C8",
  poiIcon: "#FFFFFF",
};

type ColorPalette = typeof lightColors;

const createMapStyle = (
  colors: ColorPalette,
  name: string,
): StyleSpecification => ({
  version: 8,
  name,
  sources: {
    composite: {
      type: "vector",
      url: "mapbox://mapbox.mapbox-streets-v8",
    },
  },
  sprite: "mapbox://sprites/mapbox/streets-v12",
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
  layers: [
    // Background
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": colors.land,
      },
    },

    // Land & Landuse
    {
      id: "landuse-park",
      type: "fill",
      source: "composite",
      "source-layer": "landuse",
      filter: ["==", ["get", "class"], "park"],
      paint: {
        "fill-color": colors.park,
      },
    },
    {
      id: "landuse-pitch",
      type: "fill",
      source: "composite",
      "source-layer": "landuse",
      filter: ["==", ["get", "class"], "pitch"],
      paint: {
        "fill-color": colors.park,
      },
    },
    {
      id: "landuse-grass",
      type: "fill",
      source: "composite",
      "source-layer": "landuse",
      filter: ["==", ["get", "class"], "grass"],
      paint: {
        "fill-color": colors.park,
      },
    },
    {
      id: "landuse-cemetery",
      type: "fill",
      source: "composite",
      "source-layer": "landuse",
      filter: ["==", ["get", "class"], "cemetery"],
      paint: {
        "fill-color": colors.cemetery,
      },
    },
    {
      id: "landuse-airport",
      type: "fill",
      source: "composite",
      "source-layer": "landuse",
      filter: ["==", ["get", "class"], "airport"],
      paint: {
        "fill-color": colors.airport,
      },
    },
    {
      id: "landuse-hospital",
      type: "fill",
      source: "composite",
      "source-layer": "landuse",
      filter: ["==", ["get", "class"], "hospital"],
      paint: {
        "fill-color": colors.airport,
      },
    },
    // Water
    {
      id: "water",
      type: "fill",
      source: "composite",
      "source-layer": "water",
      paint: {
        "fill-color": colors.water,
      },
    },
    {
      id: "waterway",
      type: "line",
      source: "composite",
      "source-layer": "waterway",
      paint: {
        "line-color": colors.water,
        "line-width": ["interpolate", ["linear"], ["zoom"], 8, 1, 14, 3, 18, 6],
      },
    },

    // Buildings
    {
      id: "building",
      type: "fill",
      source: "composite",
      "source-layer": "building",
      minzoom: 14,
      paint: {
        "fill-color": colors.building,
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 14, 0, 15, 1],
      },
    },
    {
      id: "building-outline",
      type: "line",
      source: "composite",
      "source-layer": "building",
      minzoom: 14,
      paint: {
        "line-color": colors.buildingOutline,
        "line-width": 0.5,
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 14, 0, 15, 1],
      },
    },

    // Aeroway (runways, taxiways)
    {
      id: "aeroway-runway",
      type: "line",
      source: "composite",
      "source-layer": "aeroway",
      filter: ["==", ["get", "type"], "runway"],
      paint: {
        "line-color": colors.airportRunway,
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 2, 14, 20],
      },
    },
    {
      id: "aeroway-taxiway",
      type: "line",
      source: "composite",
      "source-layer": "aeroway",
      filter: ["==", ["get", "type"], "taxiway"],
      paint: {
        "line-color": colors.airportRunway,
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.5, 14, 4],
      },
    },

    // Roads - Casings (drawn first, underneath fills)
    {
      id: "road-path-casing",
      type: "line",
      source: "composite",
      "source-layer": "road",
      filter: ["==", ["get", "class"], "path"],
      minzoom: 14,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": colors.roadCasing,
        "line-width": ["interpolate", ["linear"], ["zoom"], 14, 1, 18, 3],
        "line-dasharray": [2, 2],
        "line-opacity": 0.5,
      },
    },
    {
      id: "road-street-casing",
      type: "line",
      source: "composite",
      "source-layer": "road",
      filter: [
        "all",
        ["match", ["get", "class"], ["street", "street_limited"], true, false],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": colors.roadCasing,
        "line-width": [
          "interpolate",
          ["exponential", 1.5],
          ["zoom"],
          10,
          0.5,
          14,
          4,
          18,
          18,
        ],
      },
    },
    {
      id: "road-secondary-casing",
      type: "line",
      source: "composite",
      "source-layer": "road",
      filter: [
        "all",
        [
          "match",
          ["get", "class"],
          ["secondary", "secondary_link", "tertiary", "tertiary_link"],
          true,
          false,
        ],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": colors.roadCasing,
        "line-width": [
          "interpolate",
          ["exponential", 1.5],
          ["zoom"],
          8,
          0.5,
          14,
          6,
          18,
          24,
        ],
      },
    },
    {
      id: "road-primary-casing",
      type: "line",
      source: "composite",
      "source-layer": "road",
      filter: [
        "all",
        ["match", ["get", "class"], ["primary", "primary_link"], true, false],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": colors.roadCasing,
        "line-width": [
          "interpolate",
          ["exponential", 1.5],
          ["zoom"],
          8,
          1,
          14,
          8,
          18,
          28,
        ],
      },
    },
    {
      id: "road-trunk-casing",
      type: "line",
      source: "composite",
      "source-layer": "road",
      filter: [
        "all",
        ["match", ["get", "class"], ["trunk", "trunk_link"], true, false],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": colors.highwayCasing,
        "line-width": [
          "interpolate",
          ["exponential", 1.5],
          ["zoom"],
          6,
          0.8,
          14,
          7,
          18,
          24,
        ],
      },
    },
    {
      id: "road-motorway-casing",
      type: "line",
      source: "composite",
      "source-layer": "road",
      filter: [
        "all",
        ["match", ["get", "class"], ["motorway", "motorway_link"], true, false],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": colors.motorwayCasing,
        "line-width": [
          "interpolate",
          ["exponential", 1.5],
          ["zoom"],
          6,
          1,
          14,
          8,
          18,
          26,
        ],
      },
    },

    // Roads - Fills (drawn on top of casings)
    {
      id: "road-street",
      type: "line",
      source: "composite",
      "source-layer": "road",
      filter: [
        "all",
        ["match", ["get", "class"], ["street", "street_limited"], true, false],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": colors.roadFill,
        "line-width": [
          "interpolate",
          ["exponential", 1.5],
          ["zoom"],
          10,
          0.5,
          14,
          3,
          18,
          16,
        ],
      },
    },
    {
      id: "road-secondary",
      type: "line",
      source: "composite",
      "source-layer": "road",
      filter: [
        "all",
        [
          "match",
          ["get", "class"],
          ["secondary", "secondary_link", "tertiary", "tertiary_link"],
          true,
          false,
        ],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": colors.roadFill,
        "line-width": [
          "interpolate",
          ["exponential", 1.5],
          ["zoom"],
          8,
          0.5,
          14,
          5,
          18,
          22,
        ],
      },
    },
    {
      id: "road-primary",
      type: "line",
      source: "composite",
      "source-layer": "road",
      filter: [
        "all",
        ["match", ["get", "class"], ["primary", "primary_link"], true, false],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": colors.roadFill,
        "line-width": [
          "interpolate",
          ["exponential", 1.5],
          ["zoom"],
          8,
          0.5,
          14,
          7,
          18,
          26,
        ],
      },
    },
    {
      id: "road-trunk",
      type: "line",
      source: "composite",
      "source-layer": "road",
      filter: [
        "all",
        ["match", ["get", "class"], ["trunk", "trunk_link"], true, false],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": colors.highwayFill,
        "line-width": [
          "interpolate",
          ["exponential", 1.5],
          ["zoom"],
          6,
          0,
          14,
          5,
          18,
          20,
        ],
      },
    },
    {
      id: "road-motorway",
      type: "line",
      source: "composite",
      "source-layer": "road",
      filter: [
        "all",
        ["match", ["get", "class"], ["motorway", "motorway_link"], true, false],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": colors.motorwayFill,
        "line-width": [
          "interpolate",
          ["exponential", 1.5],
          ["zoom"],
          6,
          0,
          14,
          6,
          18,
          22,
        ],
      },
    },

    // Rail (above ground only, visible at high zoom)
    {
      id: "rail-casing",
      type: "line",
      source: "composite",
      "source-layer": "road",
      minzoom: 15,
      filter: [
        "all",
        ["==", ["get", "class"], "major_rail"],
        ["!=", ["get", "structure"], "tunnel"],
      ],
      paint: {
        "line-color": colors.rail,
        "line-width": ["interpolate", ["linear"], ["zoom"], 15, 2, 18, 4],
        "line-opacity": 0.3,
      },
    },
    {
      id: "rail",
      type: "line",
      source: "composite",
      "source-layer": "road",
      minzoom: 15,
      filter: [
        "all",
        ["==", ["get", "class"], "major_rail"],
        ["!=", ["get", "structure"], "tunnel"],
      ],
      paint: {
        "line-color": colors.rail,
        "line-width": ["interpolate", ["linear"], ["zoom"], 15, 1, 18, 2],
      },
    },
    {
      id: "rail-minor",
      type: "line",
      source: "composite",
      "source-layer": "road",
      minzoom: 16,
      filter: [
        "all",
        ["==", ["get", "class"], "minor_rail"],
        ["!=", ["get", "structure"], "tunnel"],
      ],
      paint: {
        "line-color": colors.rail,
        "line-width": ["interpolate", ["linear"], ["zoom"], 16, 0.5, 18, 1],
        "line-opacity": 0.7,
      },
    },

    // Admin boundaries
    {
      id: "admin-state-boundary",
      type: "line",
      source: "composite",
      "source-layer": "admin",
      filter: [
        "all",
        ["==", ["get", "admin_level"], 1],
        ["==", ["get", "maritime"], 0],
      ],
      paint: {
        "line-color": colors.stateBorder,
        "line-width": ["interpolate", ["linear"], ["zoom"], 4, 1, 10, 2],
        "line-dasharray": [3, 2],
        "line-opacity": 0.5,
      },
    },
    {
      id: "admin-country-boundary",
      type: "line",
      source: "composite",
      "source-layer": "admin",
      filter: [
        "all",
        ["==", ["get", "admin_level"], 0],
        ["==", ["get", "maritime"], 0],
      ],
      paint: {
        "line-color": colors.adminBorder,
        "line-width": ["interpolate", ["linear"], ["zoom"], 4, 1.5, 10, 3],
        "line-opacity": 0.6,
      },
    },

    // Water labels
    {
      id: "water-label",
      type: "symbol",
      source: "composite",
      "source-layer": "natural_label",
      filter: ["==", ["get", "class"], "water"],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["DIN Pro Italic", "Arial Unicode MS Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 8, 10, 14, 14],
        "text-max-width": 8,
      },
      paint: {
        "text-color": colors.labelSecondary,
        "text-halo-color": colors.labelHalo,
        "text-halo-width": 1,
      },
    },

    // Place labels
    {
      id: "place-neighborhood",
      type: "symbol",
      source: "composite",
      "source-layer": "place_label",
      filter: [
        "match",
        ["get", "type"],
        ["neighbourhood", "quarter"],
        true,
        false,
      ],
      minzoom: 12,
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 12, 10, 16, 14],
        "text-max-width": 8,
        "text-transform": "uppercase",
        "text-letter-spacing": 0.1,
      },
      paint: {
        "text-color": colors.labelTertiary,
        "text-halo-color": colors.labelHalo,
        "text-halo-width": 1,
      },
    },
    {
      id: "place-suburb",
      type: "symbol",
      source: "composite",
      "source-layer": "place_label",
      filter: ["==", ["get", "type"], "suburb"],
      minzoom: 10,
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 10, 10, 14, 13],
        "text-max-width": 8,
        "text-transform": "uppercase",
        "text-letter-spacing": 0.05,
      },
      paint: {
        "text-color": colors.labelTertiary,
        "text-halo-color": colors.labelHalo,
        "text-halo-width": 1.5,
      },
    },
    {
      id: "place-island",
      type: "symbol",
      source: "composite",
      "source-layer": "natural_label",
      filter: ["==", ["get", "class"], "landform"],
      minzoom: 10,
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 10, 10, 14, 13],
        "text-max-width": 8,
        "text-transform": "uppercase",
        "text-letter-spacing": 0.05,
      },
      paint: {
        "text-color": colors.labelTertiary,
        "text-halo-color": colors.labelHalo,
        "text-halo-width": 1.5,
      },
    },
    {
      id: "place-town",
      type: "symbol",
      source: "composite",
      "source-layer": "place_label",
      filter: [
        "match",
        ["get", "type"],
        ["town", "village", "hamlet"],
        true,
        false,
      ],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["DIN Pro Regular", "Arial Unicode MS Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 8, 11, 14, 16],
        "text-max-width": 8,
      },
      paint: {
        "text-color": colors.labelPrimary,
        "text-halo-color": colors.labelHalo,
        "text-halo-width": 1.5,
      },
    },
    {
      id: "place-city",
      type: "symbol",
      source: "composite",
      "source-layer": "place_label",
      filter: ["==", ["get", "type"], "city"],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 6, 12, 14, 22],
        "text-max-width": 8,
      },
      paint: {
        "text-color": colors.labelPrimary,
        "text-halo-color": colors.labelHalo,
        "text-halo-width": 2,
      },
    },

    // Road labels
    {
      id: "road-label",
      type: "symbol",
      source: "composite",
      "source-layer": "road",
      filter: [
        "match",
        ["get", "class"],
        [
          "street",
          "street_limited",
          "primary",
          "primary_link",
          "secondary",
          "secondary_link",
          "tertiary",
          "tertiary_link",
        ],
        true,
        false,
      ],
      minzoom: 12,
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["DIN Pro Regular", "Arial Unicode MS Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 12, 9, 16, 12],
        "symbol-placement": "line",
        "text-rotation-alignment": "map",
        "text-pitch-alignment": "viewport",
      },
      paint: {
        "text-color": colors.labelSecondary,
        "text-halo-color": colors.labelHalo,
        "text-halo-width": 1,
      },
    },
    {
      id: "road-label-highway",
      type: "symbol",
      source: "composite",
      "source-layer": "road",
      filter: ["match", ["get", "class"], ["motorway", "trunk"], true, false],
      minzoom: 10,
      layout: {
        "text-field": ["get", "ref"],
        "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 10, 9, 14, 12],
        "symbol-placement": "line",
        "text-rotation-alignment": "viewport",
        "text-pitch-alignment": "viewport",
      },
      paint: {
        "text-color": colors.labelSecondary,
        "text-halo-color": colors.labelHalo,
        "text-halo-width": 1.5,
      },
    },

    // POI labels - Parks and gardens (green)
    {
      id: "poi-label-park",
      type: "symbol",
      source: "composite",
      "source-layer": "poi_label",
      filter: [
        "all",
        ["<=", ["get", "filterrank"], 3],
        [
          "match",
          ["get", "class"],
          ["park", "park_like", "cemetery"],
          true,
          false,
        ],
      ],
      minzoom: 10,
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 10, 10, 14, 13],
        "text-max-width": 8,
      },
      paint: {
        "text-color": colors.labelGreen,
        "text-halo-color": colors.labelHalo,
        "text-halo-width": 1.5,
      },
    },
    // POI labels - Other
    {
      id: "poi-label",
      type: "symbol",
      source: "composite",
      "source-layer": "poi_label",
      filter: [
        "all",
        ["<=", ["get", "filterrank"], 2],
        [
          "match",
          ["get", "class"],
          ["park", "park_like", "cemetery"],
          false,
          true,
        ],
      ],
      minzoom: 14,
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["DIN Pro Regular", "Arial Unicode MS Regular"],
        "text-size": 10,
        "text-max-width": 8,
      },
      paint: {
        "text-color": colors.labelSecondary,
        "text-halo-color": colors.labelHalo,
        "text-halo-width": 1,
      },
    },
  ],
});

export const mapboxLightStyle = createMapStyle(lightColors, "Custom Light");
export const mapboxDarkStyle = createMapStyle(darkColors, "Custom Dark");

// Export colors for use elsewhere if needed
export { lightColors as mapboxLightColors, darkColors as mapboxDarkColors };
