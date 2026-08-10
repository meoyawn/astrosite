import rawTravelData from "../../travels.json"

export interface TravelPlace {
  country: string
  id: string
  latitude: number
  longitude: number
  name: string
  region?: string
}

export interface TravelEvent {
  dateLabel?: string
  end: string
  id: string
  kind: string
  note?: string
  placeIds: string[]
  start: string
}

export interface TravelTrip {
  basis: string
  end: string
  id: string
  mode?: string
  note?: string
  start: string
}

export interface TravelTransfer {
  date: string
  fromPlaceId: string
  legs: TravelTransferLeg[]
  note?: string
  toPlaceId: string
  tripId: string
}

export interface TravelTransferLeg {
  from: TravelTransferPoint
  mode: string
  to: TravelTransferPoint
}

export interface TravelTransferPoint {
  placeId?: string
  waypointId?: string
}

export interface TravelWaypoint {
  code: string
  country: string
  id: string
  kind: string
  latitude: number
  longitude: number
  name: string
}

export interface TravelData {
  coordinateSource: {
    licenseUrl: string
    name: string
    retrieved: string
    url: string
  }
  coverage: {
    end: string
    start: string
  }
  dateSemantics: {
    handoffRule: string
    interval: string
    uncertaintyRule: string
    waypointRule: string
  }
  routeSemantics: {
    homeBaseRule: string
    tripRule: string
  }
  homeBases: Array<{
    basis: string
    before: string
    note: string
    placeId: string
  }>
  knownOverlaps: Array<{
    eventIds: string[]
    note: string
  }>
  places: TravelPlace[]
  schemaVersion: number
  timeline: TravelEvent[]
  title: string
  transfers: TravelTransfer[]
  trips: TravelTrip[]
  waypoints: TravelWaypoint[]
}

export interface TravelRoute {
  dateEnd: string
  dateStart: string
  id: string
  mode: string | undefined
  sourceLabel: string
  sourcePosition: [number, number]
  targetLabel: string
  targetPosition: [number, number]
  tripId: string
}

export const travelData: TravelData = rawTravelData

export const tripsById = new Map(
  travelData.trips.map(trip => [trip.id, trip]),
)

export const placesById = new Map(
  travelData.places.map(place => [place.id, place]),
)

export const getPlace = (placeId: string): TravelPlace => {
  const place = placesById.get(placeId)

  if (place === undefined) {
    throw new TypeError(`Unknown travel place: ${placeId}`)
  }

  return place
}

export const placePosition = (place: TravelPlace): [number, number] => [
  place.longitude,
  place.latitude,
]

export const waypointsById = new Map(
  travelData.waypoints.map(waypoint => [waypoint.id, waypoint]),
)

export const getWaypoint = (waypointId: string): TravelWaypoint => {
  const waypoint = waypointsById.get(waypointId)

  if (waypoint === undefined) {
    throw new TypeError(`Unknown travel waypoint: ${waypointId}`)
  }

  return waypoint
}

export const waypointPosition = (
  waypoint: TravelWaypoint,
): [number, number] => [waypoint.longitude, waypoint.latitude]

export const eventsByPlaceId = new Map(
  travelData.places.map(place => [
    place.id,
    travelData.timeline.filter(event => event.placeIds.includes(place.id)),
  ]),
)

export const getEventsForPlace = (placeId: string): TravelEvent[] =>
  eventsByPlaceId.get(placeId) ?? []

export const getEventsForTrip = (trip: TravelTrip): TravelEvent[] =>
  travelData.timeline.filter(
    event => event.start >= trip.start && event.end <= trip.end,
  )

export const getEventPlaceLabel = (event: TravelEvent): string =>
  event.placeIds.map(placeId => getPlace(placeId).name).join(" + ")

export const getPlaceLabel = (place: TravelPlace): string =>
  `${place.name}, ${place.country}`

export const getEventCenter = (event: TravelEvent): [number, number] => {
  const places = event.placeIds.map(getPlace)
  const sum = places.reduce<[number, number]>(
    (center, place) => [
      center[0] + place.longitude,
      center[1] + place.latitude,
    ],
    [0, 0],
  )

  return [sum[0] / places.length, sum[1] / places.length]
}

const isSamePosition = (
  source: [number, number],
  target: [number, number],
): boolean => source[0] === target[0] && source[1] === target[1]

const getTransferPoint = (
  point: TravelTransferPoint,
): { label: string; position: [number, number] } => {
  if (point.placeId !== undefined && point.waypointId === undefined) {
    const place = getPlace(point.placeId)

    return { label: place.name, position: placePosition(place) }
  }

  if (point.waypointId !== undefined && point.placeId === undefined) {
    const waypoint = getWaypoint(point.waypointId)

    return { label: waypoint.code, position: waypointPosition(waypoint) }
  }

  throw new TypeError("A transfer point must reference exactly one place or waypoint")
}

export const buildTravelRoutes = (): TravelRoute[] => {
  const routes: TravelRoute[] = []

  for (const trip of travelData.trips) {
    const events = getEventsForTrip(trip)
    const transfers = travelData.transfers.filter(
      transfer =>
        transfer.tripId === trip.id &&
        transfer.date >= trip.start &&
        transfer.date <= trip.end,
    )

    for (const [index, sourceEvent] of events.slice(0, -1).entries()) {
      const targetEvent = events[index + 1]

      if (targetEvent === undefined) {
        continue
      }

      const sourcePosition = getEventCenter(sourceEvent)
      const targetPosition = getEventCenter(targetEvent)
      const hasExplicitTransfer = transfers.some(
        transfer =>
          sourceEvent.placeIds.includes(transfer.fromPlaceId) &&
          targetEvent.placeIds.includes(transfer.toPlaceId) &&
          transfer.date >= sourceEvent.end &&
          transfer.date <= targetEvent.start,
      )

      if (!isSamePosition(sourcePosition, targetPosition) && !hasExplicitTransfer) {
        routes.push({
          dateEnd: targetEvent.start,
          dateStart: targetEvent.start,
          id: `${trip.id}-${sourceEvent.id}--${targetEvent.id}`,
          mode: trip.mode,
          sourceLabel: getEventPlaceLabel(sourceEvent),
          sourcePosition,
          targetLabel: getEventPlaceLabel(targetEvent),
          targetPosition,
          tripId: trip.id,
        })
      }
    }

    for (const event of events) {
      const positions = event.placeIds.map(placeId => placePosition(getPlace(placeId)))

      for (const [index, sourcePosition] of positions.slice(0, -1).entries()) {
        const targetPosition = positions[index + 1]

        if (targetPosition === undefined || isSamePosition(sourcePosition, targetPosition)) {
          continue
        }

        routes.push({
          dateEnd: event.end,
          dateStart: event.start,
          id: `${trip.id}-${event.id}-place-${index}`,
          mode: trip.mode,
          sourceLabel: getPlace(event.placeIds[index] ?? "").name,
          sourcePosition,
          targetLabel: getPlace(event.placeIds[index + 1] ?? "").name,
          targetPosition,
          tripId: trip.id,
        })
      }
    }

    for (const transfer of transfers) {
      for (const [index, leg] of transfer.legs.entries()) {
        const source = getTransferPoint(leg.from)
        const target = getTransferPoint(leg.to)

        if (isSamePosition(source.position, target.position)) {
          continue
        }

        routes.push({
          dateEnd: transfer.date,
          dateStart: transfer.date,
          id: `${trip.id}-transfer-${transfer.date}-${index}`,
          mode: leg.mode,
          sourceLabel: source.label,
          sourcePosition: source.position,
          targetLabel: target.label,
          targetPosition: target.position,
          tripId: trip.id,
        })
      }
    }
  }

  return routes
}

export const travelRoutes = buildTravelRoutes()

const utcDate = (isoDate: string): Date => new Date(`${isoDate}T00:00:00Z`)

const dayMonthFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
})

const fullDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
})

export const formatDateRange = (start: string, end: string): string => {
  const startDate = utcDate(start)
  const endDate = utcDate(end)

  if (start === end) {
    return fullDateFormatter.format(startDate)
  }

  if (startDate.getUTCFullYear() === endDate.getUTCFullYear()) {
    return `${dayMonthFormatter.format(startDate)} — ${fullDateFormatter.format(endDate)}`
  }

  return `${fullDateFormatter.format(startDate)} — ${fullDateFormatter.format(endDate)}`
}

export const formatEventDate = (event: TravelEvent): string =>
  event.dateLabel ?? formatDateRange(event.start, event.end)

const millisecondsPerDay = 86_400_000

export const isoDateToDayNumber = (isoDate: string): number =>
  Math.floor(utcDate(isoDate).getTime() / millisecondsPerDay)

export const findClosestEvent = (dayNumber: number): TravelEvent => {
  const containingEvents = travelData.timeline.filter(
    event =>
      isoDateToDayNumber(event.start) <= dayNumber &&
      isoDateToDayNumber(event.end) >= dayNumber,
  )
  const containingEvent = containingEvents[0]

  if (containingEvent !== undefined) {
    return containingEvent
  }

  const nearestEvent = travelData.timeline.reduce<
    { distance: number; event: TravelEvent } | undefined
  >((nearest, event) => {
    const startDistance = Math.abs(isoDateToDayNumber(event.start) - dayNumber)
    const endDistance = Math.abs(isoDateToDayNumber(event.end) - dayNumber)
    const distance = Math.min(startDistance, endDistance)

    if (nearest === undefined || distance < nearest.distance) {
      return { distance, event }
    }

    return nearest
  }, undefined)

  if (nearestEvent === undefined) {
    throw new TypeError("Travel timeline is empty")
  }

  return nearestEvent.event
}

export const firstTravelDay = isoDateToDayNumber(travelData.coverage.start)
export const lastTravelDay = isoDateToDayNumber(travelData.coverage.end)

export const travelYears = Array.from(
  {
    length:
      Number(travelData.coverage.end.slice(0, 4)) -
      Number(travelData.coverage.start.slice(0, 4)) +
      1,
  },
  (_, index) => Number(travelData.coverage.start.slice(0, 4)) + index,
)

export const travelCountryCount = new Set(
  travelData.places.map(place => place.country),
).size
