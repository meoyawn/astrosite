import { ArcLayer, ScatterplotLayer } from "@deck.gl/layers"
import { MapboxOverlay } from "@deck.gl/mapbox"
import { Slider } from "@kobalte/core/slider"
import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { travelRoute } from "../../routes.ts"
import {
  findEventOnDay,
  firstTravelDay,
  formatDateRange,
  formatEventDate,
  getEventCenter,
  getEventPlaceLabel,
  getEventsForPlace,
  getPlace,
  getPlaceLabel,
  isoDateToDayNumber,
  lastTravelDay,
  placePosition,
  placesById,
  travelData,
  travelRoutes,
  travelYears,
  type TravelEvent,
  type TravelPlace,
  type TravelRoute,
  type TravelWaypoint,
  waypointPosition,
  waypointsById,
} from "./travel-data.ts"

const mapStyleUrl = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"

const travelRoutesById = new Map(travelRoutes.map(route => [route.id, route]))
const homeBase = getPlace("kazan")

const travelObjectId = (value: unknown): string | undefined => {
  if (typeof value !== "object" || value === null || !("id" in value)) {
    return undefined
  }

  return typeof value.id === "string" ? value.id : undefined
}

const escapeTooltipHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")

const routeModeLabel = (mode: string | undefined): string => {
  switch (mode) {
    case "bus":
      return "Bus"
    case "plane":
      return "Flight"
    case "planeAndGround":
      return "Flight + ground"
    case "ground":
      return "Ground"
    case undefined:
      return "Journey"
    default:
      return mode
  }
}

const routeTooltipHtml = (route: TravelRoute): string => {
  const date = formatDateRange(route.dateStart, route.dateEnd)

  return [
    '<div data-travel-route-tooltip>',
    `<strong>${escapeTooltipHtml(route.sourceLabel)} <span aria-hidden="true">→</span> ${escapeTooltipHtml(route.targetLabel)}</strong>`,
    `<span data-travel-tooltip-meta>${escapeTooltipHtml(routeModeLabel(route.mode))} · ${escapeTooltipHtml(date)}</span>`,
    "</div>",
  ].join("")
}

const initialCenter: [number, number] = [68, 24]
const initialZoom = window.innerWidth > 820 ? 3 : 2.1

const positionMatches = (
  first: [number, number],
  second: [number, number],
): boolean => first[0] === second[0] && first[1] === second[1]

const elevatedMarkerPosition = (
  position: [number, number],
): [number, number, number] => [position[0], position[1], 5_000]

const labelForEvent = (event: TravelEvent): string => {
  if (event.placeIds.length === 1) {
    return getPlaceLabel(getPlace(event.placeIds[0] ?? ""))
  }

  return getEventPlaceLabel(event)
}

const dateRangeForPlace = (placeId: string): string => {
  const events = getEventsForPlace(placeId)
  const firstEvent = events[0]
  const lastEvent = events.at(-1)

  if (firstEvent === undefined || lastEvent === undefined) {
    return "No dated stays"
  }

  return formatDateRange(firstEvent.start, lastEvent.end)
}

export const TravelMap = () => {
  let map: maplibregl.Map | undefined
  let overlay: MapboxOverlay | undefined
  let globeElement: HTMLDivElement | undefined
  let mapElement: HTMLDivElement | undefined

  const [mapStatus, setMapStatus] = createSignal<string | undefined>("Loading...")
  const [selectedDay, setSelectedDay] = createSignal(firstTravelDay)
  const [selectedEventId, setSelectedEventId] = createSignal<string>()
  const [selectedPlaceId, setSelectedPlaceId] = createSignal<string>()
  const [isTimelineSliding, setIsTimelineSliding] = createSignal(false)

  const selectedEvent = createMemo(() => {
    const eventId = selectedEventId()

    return travelData.timeline.find(event => event.id === eventId)
  })

  const selectedPlace = createMemo(() => {
    const placeId = selectedPlaceId()

    return placeId === undefined ? undefined : getPlace(placeId)
  })

  const activeCenter = createMemo<[number, number] | undefined>(() => {
    const event = selectedEvent()

    if (event !== undefined) {
      return getEventCenter(event)
    }

    const place = selectedPlace()
    return place === undefined ? undefined : placePosition(place)
  })

  const activePlaceIds = createMemo(() => {
    const event = selectedEvent()

    if (event !== undefined) {
      return event.placeIds
    }

    const placeId = selectedPlaceId()
    return placeId === undefined ? [] : [placeId]
  })

  const relatedEvents = createMemo(() => {
    const placeId = selectedPlaceId()
    return placeId === undefined
      ? []
      : getEventsForPlace(placeId).filter(event => event.kind !== "base")
  })

  const displayPlace = createMemo(() => {
    const event = selectedEvent()

    if (event !== undefined) {
      return labelForEvent(event)
    }

    const place = selectedPlace()
    return place === undefined ? "All journeys" : getPlaceLabel(place)
  })

  const displayDate = createMemo(() => {
    const event = selectedEvent()

    if (event !== undefined) {
      return formatEventDate(event)
    }

    const placeId = selectedPlaceId()

    if (placeId !== undefined) {
      if (placeId === homeBase.id) {
        return "No trip"
      }

      return dateRangeForPlace(placeId)
    }

    return formatDateRange(travelData.coverage.start, travelData.coverage.end)
  })

  const timelineValueText = createMemo(
    () => `${displayPlace()}, ${displayDate()}`,
  )
  const timelineExactDate = createMemo(function getTimelineExactDate() {
    const isoDate = new Date(selectedDay() * 86_400_000)
      .toISOString()
      .slice(0, 10)

    return formatDateRange(isoDate, isoDate)
  })
  const timelineDateAlignment = createMemo(function getTimelineDateAlignment() {
    const progress =
      (selectedDay() - firstTravelDay) / (lastTravelDay - firstTravelDay)

    if (progress < 0.08) {
      return "start"
    }

    if (progress > 0.92) {
      return "end"
    }

    return "center"
  })
  const selectedYear = createMemo(() =>
    new Date(selectedDay() * 86_400_000).getUTCFullYear(),
  )

  const flyTo = (position: [number, number]): void => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches

    map?.easeTo({
      center: position,
      duration: prefersReducedMotion ? 0 : 850,
      essential: true,
    })
  }

  const selectPlace = (place: TravelPlace): void => {
    clearTravelFragment()
    setSelectedEventId(undefined)
    setSelectedPlaceId(place.id)
    flyTo(placePosition(place))
  }

  const selectEvent = (
    event: TravelEvent,
    day = isoDateToDayNumber(event.start),
    position = getEventCenter(event),
  ): void => {
    setSelectedDay(day)
    setSelectedEventId(event.id)
    setSelectedPlaceId(event.placeIds[0])
    flyTo(position)
  }

  function clearTravelFragment(): void {
    if (location.hash !== "") {
      history.replaceState(null, "", `${location.pathname}${location.search}`)
    }
  }

  function selectVisit(
    event: TravelEvent,
    day = isoDateToDayNumber(event.start),
    position = getEventCenter(event),
  ): void {
    selectEvent(event, day, position)

    const route = travelRoute(encodeURIComponent(event.id))

    if (`${location.pathname}${location.hash}` !== route) {
      history.pushState(null, "", route)
    }
  }

  function resetTravelSelection(): void {
    setSelectedDay(firstTravelDay)
    setSelectedEventId(undefined)
    setSelectedPlaceId(undefined)

    const prefersReducedMotion = matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches

    map?.easeTo({
      center: initialCenter,
      duration: prefersReducedMotion ? 0 : 850,
      essential: true,
      zoom: initialZoom,
    })
  }

  function syncSelectionFromFragment(): void {
    const encodedEventId = location.hash.slice(1)

    if (encodedEventId === "") {
      resetTravelSelection()
      return
    }

    let eventId: string

    try {
      eventId = decodeURIComponent(encodedEventId)
    } catch {
      resetTravelSelection()
      return
    }

    const event = travelData.timeline.find(item => item.id === eventId)

    if (event === undefined) {
      resetTravelSelection()
      return
    }

    selectEvent(event)
  }

  function handleTimelineChange(values: number[]): void {
    const day = values[0]

    if (day === undefined) {
      return
    }

    const event = findEventOnDay(day)

    clearTravelFragment()
    setSelectedDay(day)

    if (event === undefined) {
      const homeBaseWasSelected =
        selectedEventId() === undefined && selectedPlaceId() === homeBase.id

      setSelectedEventId(undefined)
      setSelectedPlaceId(homeBase.id)

      if (!homeBaseWasSelected) {
        flyTo(placePosition(homeBase))
      }

      return
    }

    if (event.id !== selectedEventId()) {
      selectEvent(event, day)
    }
  }

  function handleTimelinePointerDown(): void {
    setIsTimelineSliding(true)
  }

  function handleTimelinePointerEnd(): void {
    setIsTimelineSliding(false)
  }

  function exposeViewLongitude(longitude: number): void {
    globeElement?.setAttribute("data-view-longitude", String(longitude))
  }

  function selectRoute(route: TravelRoute): void {
    const day = isoDateToDayNumber(route.dateStart)
    const destinationEvent = travelData.timeline.find(
      event => event.id === route.destinationEventId,
    )

    if (destinationEvent !== undefined) {
      selectVisit(destinationEvent, day, route.targetPosition)
      return
    }

    clearTravelFragment()
    setSelectedDay(day)
    setSelectedEventId(undefined)
    setSelectedPlaceId(route.targetPlaceId)
    flyTo(route.targetPosition)
  }

  const createLayers = () => {
    const selectedIds = new Set(activePlaceIds())
    const center = activeCenter()
    const activeRoutes = center === undefined
      ? []
      : travelRoutes.filter(
          route =>
            positionMatches(route.sourcePosition, center) ||
            positionMatches(route.targetPosition, center),
        )

    return [
      new ArcLayer<TravelRoute>({
        autoHighlight: true,
        data: travelRoutes,
        getHeight: 0.008,
        getSourceColor: [2, 132, 199, 138],
        getSourcePosition: route => elevatedMarkerPosition(route.sourcePosition),
        getTargetColor: [14, 165, 233, 156],
        getTargetPosition: route => elevatedMarkerPosition(route.targetPosition),
        getWidth: 1.35,
        greatCircle: true,
        highlightColor: [2, 132, 199, 225],
        id: "journeys",
        numSegments: 80,
        onClick: info => {
          if (info.object !== undefined) {
            selectRoute(info.object)
          }

          return true
        },
        parameters: { cullMode: "none" },
        pickable: true,
        widthMinPixels: 0.8,
        widthUnits: "pixels",
      }),
      new ArcLayer<TravelRoute>({
        autoHighlight: true,
        data: activeRoutes,
        getHeight: 0.014,
        getSourceColor: [2, 132, 199, 210],
        getSourcePosition: route => elevatedMarkerPosition(route.sourcePosition),
        getTargetColor: [2, 132, 199, 210],
        getTargetPosition: route => elevatedMarkerPosition(route.targetPosition),
        getWidth: 2,
        greatCircle: true,
        highlightColor: [3, 105, 161, 255],
        id: "active-journeys",
        numSegments: 80,
        onClick: info => {
          if (info.object !== undefined) {
            selectRoute(info.object)
          }

          return true
        },
        parameters: { cullMode: "none" },
        pickable: true,
        widthMinPixels: 1.8,
        widthUnits: "pixels",
      }),
      new ScatterplotLayer<TravelWaypoint>({
        data: travelData.waypoints,
        getFillColor: [2, 132, 199, 145],
        getLineColor: [255, 255, 255, 220],
        getLineWidth: 1,
        getPosition: waypoint => elevatedMarkerPosition(waypointPosition(waypoint)),
        getRadius: 2.5,
        id: "waypoints",
        lineWidthUnits: "pixels",
        pickable: true,
        radiusMaxPixels: 4,
        radiusMinPixels: 2,
        radiusUnits: "pixels",
        stroked: true,
      }),
      new ScatterplotLayer<TravelPlace>({
        autoHighlight: true,
        data: travelData.places,
        getFillColor: place =>
          selectedIds.has(place.id)
            ? [2, 132, 199, 255]
            : [92, 103, 116, 205],
        getLineColor: [255, 255, 255, 235],
        getLineWidth: 1.5,
        getPosition: place => elevatedMarkerPosition(placePosition(place)),
        getRadius: place => 4 + Math.min(getEventsForPlace(place.id).length, 4) * 0.45,
        highlightColor: [2, 132, 199, 95],
        id: "places",
        lineWidthUnits: "pixels",
        onClick: info => {
          if (info.object !== undefined) {
            selectPlace(info.object)
          }

          return true
        },
        pickable: true,
        radiusMaxPixels: 8,
        radiusMinPixels: 4,
        radiusUnits: "pixels",
        stroked: true,
      }),
      new ScatterplotLayer<TravelPlace>({
        data: travelData.places.filter(place => selectedIds.has(place.id)),
        filled: false,
        getLineColor: [2, 132, 199, 230],
        getLineWidth: 3,
        getPosition: place => elevatedMarkerPosition(placePosition(place)),
        getRadius: 13,
        id: "selected-place-halo",
        lineWidthUnits: "pixels",
        pickable: false,
        radiusUnits: "pixels",
        stroked: true,
      }),
    ]
  }

  createEffect(() => {
    activeCenter()
    activePlaceIds()
    overlay?.setProps({ layers: createLayers() })
  })

  onMount(() => {
    try {
      if (mapElement === undefined) {
        throw new TypeError("Travel globe container is missing")
      }

      map = new maplibregl.Map({
        attributionControl: false,
        canvasContextAttributes: { antialias: true },
        center: initialCenter,
        container: mapElement,
        maxZoom: 7,
        minZoom: 0,
        renderWorldCopies: false,
        style: mapStyleUrl,
        zoom: initialZoom,
      })

      overlay = new MapboxOverlay({
        getTooltip: info => {
          const objectId = travelObjectId(info.object)

          if (
            info.layer?.id === "journeys" ||
            info.layer?.id === "active-journeys"
          ) {
            const route =
              objectId === undefined ? undefined : travelRoutesById.get(objectId)

            return route === undefined
              ? null
              : {
                  className: "travel-tooltip travel-tooltip--route",
                  html: routeTooltipHtml(route),
                }
          }

          if (info.layer?.id === "waypoints") {
            const waypoint =
              objectId === undefined ? undefined : waypointsById.get(objectId)

            return waypoint === undefined
              ? null
              : {
                  className: "travel-tooltip",
                  text: `${waypoint.code} · ${waypoint.name}`,
                }
          }

          const place = objectId === undefined ? undefined : placesById.get(objectId)

          if (place === undefined) {
            return null
          }

          return {
            className: "travel-tooltip",
            text: getPlaceLabel(place),
          }
        },
        interleaved: true,
        layers: createLayers(),
        pickingRadius: 8,
      })

      map.addControl(overlay)
      map.on("style.load", () => map?.setProjection({ type: "globe" }))
      map.on("load", () => setMapStatus(undefined))
      map.on("error", event => {
        setMapStatus(`Map unavailable: ${event.error.message}`)
      })
      map.on("moveend", () => {
        exposeViewLongitude(map?.getCenter().lng ?? initialCenter[0])
      })

      syncSelectionFromFragment()
      addEventListener("hashchange", syncSelectionFromFragment)
      onCleanup(() => {
        removeEventListener("hashchange", syncSelectionFromFragment)
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load the globe"
      setMapStatus(`Map unavailable: ${message}`)
    }
  })

  onCleanup(() => map?.remove())

  return (
    <section data-travel-shell aria-label="Travel map">
      <section data-travel-focus aria-live="polite">
        <Slider
          data-travel-timeline
          getValueLabel={() => `${timelineExactDate()} — ${timelineValueText()}`}
          maxValue={lastTravelDay}
          minValue={firstTravelDay}
          step={1}
          value={[selectedDay()]}
          onChange={handleTimelineChange}
          onChangeEnd={handleTimelinePointerEnd}
        >
          <div
            data-travel-years
            aria-hidden="true"
            style={{ "--travel-year-count": String(travelYears.length) }}
          >
            <For each={travelYears}>
              {year => (
                <span
                  data-active={
                    selectedPlaceId() !== undefined && selectedYear() === year
                  }
                >
                  {year}
                </span>
              )}
            </For>
          </div>
          <Slider.Track
            data-travel-track
            onPointerCancel={handleTimelinePointerEnd}
            onPointerDown={handleTimelinePointerDown}
          >
            <Slider.Fill data-travel-fill />
            <Slider.Thumb
              data-travel-thumb
              aria-label="Travel timeline"
              onPointerCancel={handleTimelinePointerEnd}
              onPointerDown={handleTimelinePointerDown}
            >
              <span
                data-travel-date-preview
                data-alignment={timelineDateAlignment()}
                data-visible={isTimelineSliding()}
                aria-hidden="true"
              >
                {timelineExactDate()}
              </span>
              <Slider.Input />
            </Slider.Thumb>
          </Slider.Track>
        </Slider>

        <div data-travel-details>
          <div data-travel-focus-place>
            <span data-travel-focus-dot aria-hidden="true" />
            <div>
              <h2>{displayPlace()}</h2>
            </div>
          </div>

          <Show when={relatedEvents().length > 0}>
            <div
              data-travel-visits
              aria-label={`Every stay in ${selectedPlace()?.name ?? "this place"}`}
            >
              <For each={relatedEvents()}>
                {event => (
                  <button
                    data-travel-visit
                    data-active={selectedEventId() === event.id}
                    type="button"
                    aria-pressed={selectedEventId() === event.id}
                    onClick={() => selectVisit(event)}
                  >
                    {formatEventDate(event)}
                  </button>
                )}
              </For>
            </div>
          </Show>
        </div>

      </section>

      <div
        ref={element => {
          globeElement = element
        }}
        data-travel-globe
        data-active-event={selectedEventId()}
        data-view-longitude={initialCenter[0]}
        aria-label="Interactive globe. Drag to rotate and scroll to zoom."
        role="application"
        tabindex="0"
      >
        <div
          ref={element => {
            mapElement = element
          }}
          data-travel-map
        />
        <Show when={mapStatus()}>
          {status => <p data-travel-globe-status>{status()}</p>}
        </Show>
      </div>

    </section>
  )
}
