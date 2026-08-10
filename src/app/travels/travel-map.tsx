import {
  Deck,
  LinearInterpolator,
  _GlobeView as GlobeView,
  _GlobeViewport as GlobeViewport,
  type GlobeViewState,
} from "@deck.gl/core"
import { ArcLayer, GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers"
import { Slider } from "@kobalte/core/slider"
import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import { feature } from "topojson-client"
import countriesTopology from "world-atlas/countries-110m.json"
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

const countryFeatures = feature(countriesTopology, "countries")
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

const createInitialViewState = (): GlobeViewState => ({
  latitude: 24,
  longitude: 68,
  maxZoom: 4,
  minZoom: -0.25,
  zoom: window.innerWidth > 820 ? 2.85 : 2.2,
})

const constrain = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum)

const cursorAnchoredViewState = (
  viewport: GlobeViewport,
  viewState: GlobeViewState,
  position: [number, number],
  zoom: number,
): GlobeViewState => {
  const unprojectedAnchor = viewport.unproject(position)
  const anchorLongitude = unprojectedAnchor[0]
  const anchorLatitude = unprojectedAnchor[1]

  if (
    anchorLongitude === undefined ||
    anchorLatitude === undefined ||
    !Number.isFinite(anchorLongitude) ||
    !Number.isFinite(anchorLatitude)
  ) {
    return { ...viewState, zoom }
  }

  const anchor: [number, number] = [anchorLongitude, anchorLatitude]
  const projectedAnchor = viewport.project(anchor)
  const projectedAnchorX = projectedAnchor[0]
  const projectedAnchorY = projectedAnchor[1]

  if (
    projectedAnchorX === undefined ||
    projectedAnchorY === undefined ||
    Math.hypot(
      projectedAnchorX - position[0],
      projectedAnchorY - position[1],
    ) > 2
  ) {
    return { ...viewState, zoom }
  }

  let longitude = viewState.longitude
  let latitude = viewState.latitude
  let anchoredZoom = zoom

  for (let index = 0; index < 3; index += 1) {
    const zoomedViewport = new GlobeViewport({
      fovy: viewport.fovy,
      height: viewport.height,
      latitude,
      longitude,
      width: viewport.width,
      zoom: anchoredZoom,
    })
    const anchorPosition = zoomedViewport.project(anchor)
    const anchorX = anchorPosition[0]
    const anchorY = anchorPosition[1]

    if (anchorX === undefined || anchorY === undefined) {
      return { ...viewState, zoom }
    }

    const anchoredState = zoomedViewport.panByPosition(
      [longitude, latitude, anchoredZoom],
      position,
      [anchorX, anchorY],
    )

    longitude = anchoredState.longitude ?? longitude
    latitude = anchoredState.latitude ?? latitude
    anchoredZoom = anchoredState.zoom ?? anchoredZoom
  }

  return {
    ...viewState,
    latitude,
    longitude,
    zoom: anchoredZoom,
  }
}

const positionMatches = (
  first: [number, number],
  second: [number, number],
): boolean => first[0] === second[0] && first[1] === second[1]

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
  let deck: Deck<GlobeView> | undefined
  const initialViewState = createInitialViewState()
  let currentViewState = initialViewState

  const [canvasElement, setCanvasElement] = createSignal<HTMLCanvasElement>()
  const [mapStatus, setMapStatus] = createSignal<string | undefined>("Loading...")
  const [selectedDay, setSelectedDay] = createSignal(firstTravelDay)
  const [selectedEventId, setSelectedEventId] = createSignal<string>()
  const [selectedPlaceId, setSelectedPlaceId] = createSignal<string>()
  const [isTimelineSliding, setIsTimelineSliding] = createSignal(false)
  const [viewLongitude, setViewLongitude] = createSignal(
    initialViewState.longitude,
  )

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

    deck?.setProps({
      initialViewState: {
        ...currentViewState,
        latitude: position[1],
        longitude: position[0],
        transitionDuration: prefersReducedMotion ? 0 : 850,
        transitionInterpolator: new LinearInterpolator([
          "longitude",
          "latitude",
        ]),
      },
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

    deck?.setProps({
      initialViewState: {
        ...initialViewState,
        transitionDuration: prefersReducedMotion ? 0 : 850,
        transitionInterpolator: new LinearInterpolator([
          "longitude",
          "latitude",
          "zoom",
        ]),
      },
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

  function handleGlobeWheel(event: WheelEvent): void {
    const viewport = deck?.getViewports()[0]

    if (!(viewport instanceof GlobeViewport)) {
      return
    }

    event.preventDefault()

    const deltaMultiplier =
      event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? viewport.height
          : 1
    const delta = event.deltaY * deltaMultiplier
    let scale = 2 / (1 + Math.exp(-Math.abs(delta * 0.01)))

    if (delta > 0) {
      scale = 1 / scale
    }

    const minimumZoom = currentViewState.minZoom ?? -Infinity
    const maximumZoom = currentViewState.maxZoom ?? Infinity
    const zoom = constrain(
      currentViewState.zoom + Math.log2(scale),
      minimumZoom,
      maximumZoom,
    )

    if (zoom === currentViewState.zoom) {
      return
    }

    const nextViewState = cursorAnchoredViewState(
      viewport,
      currentViewState,
      [event.offsetX, event.offsetY],
      zoom,
    )

    currentViewState = nextViewState
    setViewLongitude(nextViewState.longitude)
    deck?.setProps({ initialViewState: nextViewState })
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
      new GeoJsonLayer({
        data: countryFeatures,
        filled: true,
        getFillColor: [244, 247, 250, 252],
        getLineColor: [199, 207, 216, 210],
        getLineWidth: 1,
        id: "countries",
        lineWidthMinPixels: 0.55,
        lineWidthUnits: "pixels",
        pickable: false,
        stroked: true,
      }),
      new ArcLayer<TravelRoute>({
        autoHighlight: true,
        data: travelRoutes,
        getHeight: 0.008,
        getSourceColor: [2, 132, 199, 138],
        getSourcePosition: route => route.sourcePosition,
        getTargetColor: [14, 165, 233, 156],
        getTargetPosition: route => route.targetPosition,
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
        getSourcePosition: route => route.sourcePosition,
        getTargetColor: [2, 132, 199, 210],
        getTargetPosition: route => route.targetPosition,
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
        getPosition: waypointPosition,
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
        getPosition: placePosition,
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
        getPosition: placePosition,
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
    deck?.setProps({ layers: createLayers() })
  })

  onMount(() => {
    try {
      const canvas = canvasElement()

      if (canvas === undefined) {
        throw new TypeError("Travel globe canvas is missing")
      }

      deck = new Deck({
        canvas,
        getCursor: ({ isDragging, isHovering }) => {
          if (isDragging) {
            return "grabbing"
          }

          return isHovering ? "pointer" : "grab"
        },
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
        initialViewState,
        layers: createLayers(),
        onError: error => {
          setMapStatus(`Map unavailable: ${error.message}`)
        },
        onLoad: () => setMapStatus(undefined),
        onViewStateChange: parameters => {
          currentViewState = parameters.viewState
          setViewLongitude(parameters.viewState.longitude)
        },
        pickingRadius: 8,
        useDevicePixels: Math.min(window.devicePixelRatio, 2),
        views: new GlobeView({
          controller: {
            doubleClickZoom: true,
            dragPan: true,
            keyboard: true,
            scrollZoom: false,
            touchZoom: true,
          },
          farZMultiplier: 2,
          id: "travel-globe",
          resolution: 3,
        }),
      })

      canvas.addEventListener("wheel", handleGlobeWheel, { passive: false })

      syncSelectionFromFragment()
      addEventListener("hashchange", syncSelectionFromFragment)
      onCleanup(() => {
        canvas.removeEventListener("wheel", handleGlobeWheel)
        removeEventListener("hashchange", syncSelectionFromFragment)
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load the globe"
      setMapStatus(`Map unavailable: ${message}`)
    }
  })

  onCleanup(() => deck?.finalize())

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

      </section>

      <div
        data-travel-globe
        data-active-event={selectedEventId()}
        data-view-longitude={viewLongitude()}
        aria-label="Interactive globe. Drag to rotate and scroll to zoom."
      >
        <canvas
          ref={element => {
            setCanvasElement(element)
          }}
          aria-label="Interactive map of every travel destination"
          role="img"
          tabindex="0"
        />
        <Show when={mapStatus()}>
          {status => <p data-travel-globe-status>{status()}</p>}
        </Show>
      </div>

    </section>
  )
}
