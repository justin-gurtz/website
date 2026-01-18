"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import polyline from "@mapbox/polyline";
import * as turf from "@turf/turf";
import filter from "lodash/filter";
import forEach from "lodash/forEach";
import includes from "lodash/includes";
import isEqual from "lodash/isEqual";
import join from "lodash/join";
import keys from "lodash/keys";
import map from "lodash/map";
import padStart from "lodash/padStart";
import reduce from "lodash/reduce";
import slice from "lodash/slice";
import startsWith from "lodash/startsWith";
import Link from "@/components/link";
import { NEXT_PUBLIC_MAPBOX_MAPS_ACCESS_TOKEN } from "@/env/public";
import type { StravaActivity } from "@/types/models";
import { mapboxDarkStyle, mapboxLightStyle } from "@/utils/mapbox-styles";
import { cn } from "@/utils/tailwind";

mapboxgl.accessToken = NEXT_PUBLIC_MAPBOX_MAPS_ACCESS_TOKEN;

const href = "https://www.strava.com/athletes/gurtz";

const maxZoom = 10.4;
const nycPoint = turf.point([-73.97, 40.725]);

const padded = (value: number, radix?: number) =>
  padStart(value.toString(radix), 2, "0");

const getComponents = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return { days, hours, minutes };
};

const StravaLogo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 432 91"
    className={className}
    aria-label="Strava"
    role="img"
  >
    <path
      fill="#FC4C02"
      d="M74.5 49.5c1.6 2.8 2.5 6.3 2.5 10.4v0.2c0 4.2-0.8 8-2.5 11.4 -1.7 3.4-4.1 6.2-7.1 8.6 -3.1 2.3-6.8 4.1-11.2 5.4 -4.4 1.3-9.3 1.9-14.7 1.9 -8.2 0-15.9-1.1-23-3.4 -7.1-2.3-13.2-5.7-18.3-10.2l14.4-17.1c4.4 3.4 9 5.8 13.8 7.2 4.8 1.5 9.6 2.2 14.4 2.2 2.5 0 4.2-0.3 5.3-0.9 1.1-0.6 1.6-1.5 1.6-2.5v-0.2c0-1.2-0.8-2.1-2.4-2.9 -1.6-0.8-4.5-1.6-8.8-2.4 -4.5-0.9-8.8-2-12.9-3.2 -4.1-1.2-7.7-2.8-10.8-4.7 -3.1-1.9-5.6-4.3-7.4-7.2C5.4 39 4.5 35.4 4.5 31.2V31c0-3.8 0.7-7.4 2.2-10.7 1.5-3.3 3.7-6.2 6.6-8.6 2.9-2.5 6.5-4.4 10.7-5.8 4.2-1.4 9.1-2.1 14.7-2.1 7.8 0 14.7 0.9 20.5 2.8 5.9 1.8 11.1 4.6 15.8 8.3L61.9 33c-3.8-2.8-7.9-4.8-12.1-6.1 -4.3-1.3-8.3-1.9-12-1.9 -2 0-3.5 0.3-4.4 0.9 -1 0.6-1.4 1.4-1.4 2.4v0.2c0 1.1 0.7 2 2.2 2.8 1.5 0.8 4.3 1.6 8.5 2.4 5.1 0.9 9.8 2 14 3.3 4.2 1.3 7.8 3 10.9 5C70.5 44.2 72.9 46.6 74.5 49.5zM75.5 28.1h23.7v57.8h26.9V28.1h23.7V5.3H75.5V28.1zM387.9 0.3l-43.3 85.6h25.8l17.5-34.6 17.6 34.6h25.8L387.9 0.3zM267.3 0.3l43.4 85.6h-25.8l-17.5-34.6 -17.5 34.6h-17.5 -8.3 -22.4l-15.2-23h-0.2 -5.5v23h-26.9V5.3H193c7.2 0 13.1 0.8 17.8 2.5 4.6 1.6 8.4 3.9 11.2 6.7 2.5 2.4 4.3 5.2 5.5 8.3 1.2 3.1 1.8 6.7 1.8 10.8v0.2c0 5.9-1.4 10.9-4.3 14.9 -2.8 4.1-6.7 7.3-11.6 9.7l14 20.4L267.3 0.3zM202.5 35.6c0-2.6-0.9-4.5-2.8-5.8 -1.8-1.3-4.3-1.9-7.5-1.9h-11.7v15.8h11.6c3.2 0 5.8-0.7 7.6-2.1 1.8-1.4 2.8-3.3 2.8-5.8V35.6zM345.2 5.3L327.6 40 310 5.3h-25.8l43.4 85.6 43.3-85.6H345.2z"
    />
  </svg>
);

const RunIcon = ({ className }: { className?: string }) => (
  <svg
    fill="currentColor"
    viewBox="0 0 24 24"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
  >
    <title>Run</title>
    <path
      d="M8.688 0C8.025 0 7.38.215 6.85.613l-3.32 2.49-2.845.948A1 1 0 000 5c0 1.579.197 2.772.567 3.734.376.978.907 1.654 1.476 2.223.305.305.6.567.886.82.785.697 1.5 1.33 2.159 2.634 1.032 2.57 2.37 4.748 4.446 6.27C11.629 22.218 14.356 23 18 23c2.128 0 3.587-.553 4.549-1.411a4.378 4.378 0 001.408-2.628c.152-.987-.389-1.787-.967-2.25l-3.892-3.114a1 1 0 01-.329-.477l-3.094-9.726A2 2 0 0013.769 2h-1.436a2 2 0 00-1.2.4l-.57.428-.516-1.803A1.413 1.413 0 008.688 0zM8.05 2.213c.069-.051.143-.094.221-.127l1.168 4.086L12.333 4h1.436l.954 3H12v2h3.36l.318 1H13v2h3.314l.55 1.726a3 3 0 00.984 1.433l3.106 2.485c-.77.19-1.778.356-2.954.356-1.97 0-3.178-.431-4.046-1.087-.895-.677-1.546-1.675-2.251-3.056-.224-.437-.45-.907-.688-1.403C9.875 10.08 8.444 7.1 5.531 4.102zM3.743 5.14c2.902 2.858 4.254 5.664 5.441 8.126.25.517.49 1.018.738 1.502.732 1.432 1.55 2.777 2.827 3.74C14.053 19.495 15.72 20 18 20c1.492 0 2.754-.23 3.684-.479a2.285 2.285 0 01-.467.575c-.5.446-1.435.904-3.217.904-3.356 0-5.629-.718-7.284-1.931-1.663-1.22-2.823-3.028-3.788-5.44a1.012 1.012 0 00-.034-.076c-.853-1.708-1.947-2.673-2.79-3.417a14.61 14.61 0 01-.647-.593c-.431-.431-.775-.88-1.024-1.527-.21-.545-.367-1.271-.417-2.3z"
      fill=""
    ></path>
  </svg>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-0 items-start">
    <p className="text-[0.625rem] text-neutral-600 dark:text-neutral-200">
      {label}
    </p>
    <p className="text-sm font-bold">{value}</p>
  </div>
);

const Strava = ({ activities }: { activities: StravaActivity[] }) => {
  const previousRuns = useRef<StravaActivity[]>([]);
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapbox = useRef<mapboxgl.Map | null>(null);
  const isInitialStyleRef = useRef(true);

  const [mapIsReady, setMapIsReady] = useState(false);
  const [hasAddedRunsToMap, setHasAddedRunsToMap] = useState(false);
  const [mapClassName, setMapClassName] = useState("opacity-0");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [styleVersion, setStyleVersion] = useState(0);

  const runs = useMemo(() => {
    return filter(activities, ({ visibility }) => visibility === "everyone");
  }, [activities]);

  const { distance, pace, time, totalRuns } = useMemo(() => {
    const totalDistance = reduce(runs, (acc, run) => acc + run.distance, 0);
    const totalMovingTime = reduce(
      runs,
      (acc, run) => acc + run.moving_time,
      0,
    );
    const miles = turf.convertLength(totalDistance, "meters", "miles");
    const avgPace = miles === 0 ? 0 : (totalMovingTime * 60) / miles;

    const milesString = miles.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

    const p = getComponents(avgPace);
    const t = getComponents(totalMovingTime);

    const leadingTStrings = [`${t.days}d`, `${t.hours}h`];
    const nonZeroTStrings = filter(leadingTStrings, (c) => !startsWith(c, "0"));
    const finalTStrings = [...nonZeroTStrings, `${t.minutes}m`];
    const slicedTStrings = slice(finalTStrings, 0, 2);

    return {
      distance: `${milesString} mi`,
      pace: `${p.hours}:${padded(p.minutes)} /mi`,
      time: join(slicedTStrings, " "),
      totalRuns: runs.length,
    };
  }, [runs]);

  // Detect and listen for system dark mode changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Update map style when dark mode changes
  useEffect(() => {
    if (!mapbox.current || !mapIsReady) return;

    // Skip the first render - initial style is set during map creation
    if (isInitialStyleRef.current) {
      isInitialStyleRef.current = false;
      return;
    }

    const map = mapbox.current;

    const readdRuns = () => {
      previousRuns.current = [];
      setStyleVersion((v) => v + 1);
    };

    map.setStyle(isDarkMode ? mapboxDarkStyle : mapboxLightStyle);

    // Style loads synchronously with local objects, so use idle event
    map.once("idle", readdRuns);

    return () => {
      map.off("idle", readdRuns);
    };
  }, [isDarkMode, mapIsReady]);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapbox.current) return;

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    mapbox.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: prefersDark ? mapboxDarkStyle : mapboxLightStyle,
      attributionControl: false,
      logoPosition: "bottom-left",
      center: nycPoint.geometry.coordinates as [number, number],
      zoom: maxZoom,
      interactive: false,
      dragPan: false,
      dragRotate: false,
      scrollZoom: false,
      keyboard: false,
      doubleClickZoom: false,
      touchPitch: false,
      touchZoomRotate: false,
    });

    mapbox.current.on("load", () => {
      setMapIsReady(true);
    });
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: styleVersion triggers re-add after style change
  useEffect(() => {
    if (runs.length === 0) return;
    if (!mapbox.current) return;
    if (!mapIsReady) return;
    if (isEqual(runs, previousRuns.current)) return;

    const currentMap = mapbox.current;

    const bounds = new mapboxgl.LngLatBounds();

    const style = currentMap.getStyle();

    if (style) {
      const runKeys = keys(style.sources);
      const runSources = filter(runKeys, (sourceId) =>
        startsWith(sourceId, "run-source-"),
      );

      forEach(runSources, (sourceId) => {
        if (currentMap.getSource(sourceId)) {
          const layers = filter(
            style.layers,
            (layer) => layer.source === sourceId,
          );

          forEach(layers, (layer) => {
            if (currentMap.getLayer(layer.id)) {
              currentMap.removeLayer(layer.id);
            }
          });

          currentMap.removeSource(sourceId);
        }
      });
    }

    forEach(runs, (run, index, array) => {
      const sourceId = `run-source-${run.id}`;
      const layerId = `run-layer-${run.id}`;

      const decoded = polyline.decode(run.map.summary_polyline);
      const coordinates = map(decoded, ([lat, lng]) => [lng, lat]);

      if (index === array.length - 1) {
        forEach(coordinates, (coord) => {
          bounds.extend(coord as [number, number]);
        });
      }

      currentMap.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates,
          },
        },
      });

      currentMap.addLayer(
        {
          id: layerId,
          type: "line",
          source: sourceId,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#FC4C02",
            "line-width": 1.25,
            "line-emissive-strength": 1,
          },
        },
        "water-label", // Insert below labels
      );
    });

    if (!bounds.isEmpty()) {
      mapbox.current.fitBounds(bounds, {
        padding: 50,
        animate: hasAddedRunsToMap,
        maxZoom,
      });
    }

    setHasAddedRunsToMap(true);

    previousRuns.current = runs;
  }, [mapIsReady, runs, hasAddedRunsToMap, styleVersion]);

  useEffect(() => {
    if (!mapbox.current) return;
    if (!hasAddedRunsToMap) return;
    if (includes(mapClassName, "opacity-100")) return;

    const bounds = mapbox.current.getBounds();

    if (bounds) {
      mapbox.current.fitBounds(bounds, {
        padding: 25,
        animate: true,
        duration: 1000,
      });
    }

    setMapClassName("opacity-100 transition-all duration-1000");
  }, [hasAddedRunsToMap, mapClassName]);

  return (
    <Link
      href={href}
      className="@container absolute size-full"
      standardBackground
      contentBrightness="light"
    >
      <div className="size-full px-3 py-2.5 @xs:px-4 @xs:py-3.5 flex flex-col gap-5 items-start">
        <div className="flex flex-col gap-3 items-start">
          <p className="font-bold text-lg">
            {totalRuns} Past Year Run{totalRuns === 1 ? "" : "s"}{" "}
            <RunIcon className="inline-block size-4.5 ml-0.5" />
          </p>
          <div className="flex flex-wrap gap-4">
            <Stat label="Distance" value={distance} />
            <Stat label="Pace" value={pace} />
            <Stat label="Time" value={time} />
          </div>
        </div>
        <div className="w-full flex-1 bg-black/4 dark:bg-white/4 rounded-squircle-inside overflow-hidden relative">
          <div
            ref={mapContainer}
            className={cn(
              "absolute size-full [&_.mapboxgl-ctrl]:hidden!",
              mapClassName,
            )}
          />
        </div>
        <StravaLogo className="h-3.5 mt-2 mb-1" />
      </div>
    </Link>
  );
};

export default Strava;
