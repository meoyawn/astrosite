import {
  buildTravelRoutes,
  findClosestEvent,
  findEventOnDay,
  formatDateRange,
  formatEventDate,
  getEventsForPlace,
  getEventsForTrip,
  isoDateToDayNumber,
  placesById,
  travelCountryCount,
  travelData,
  tripsById,
  type TravelPlace,
  waypointsById,
} from "./travel-data.ts"
import { describe, expect, test } from "vitest"

describe("travel data", () => {
  test("keeps every mapped place directly geocoded", () => {
    expect(travelCountryCount).toEqual(
      new Set(travelData.places.map(place => place.country)).size,
    )
    expect(new Set(travelData.places.map(place => place.id)).size).toEqual(
      travelData.places.length,
    )
    expect(new Set(travelData.waypoints.map(waypoint => waypoint.id)).size).toEqual(
      travelData.waypoints.length,
    )

    for (const place of travelData.places) {
      expect(place.latitude).toBeGreaterThanOrEqual(-90)
      expect(place.latitude).toBeLessThanOrEqual(90)
      expect(place.longitude).toBeGreaterThanOrEqual(-180)
      expect(place.longitude).toBeLessThanOrEqual(180)
    }

    for (const waypoint of travelData.waypoints) {
      expect(waypoint.latitude).toBeGreaterThanOrEqual(-90)
      expect(waypoint.latitude).toBeLessThanOrEqual(90)
      expect(waypoint.longitude).toBeGreaterThanOrEqual(-180)
      expect(waypoint.longitude).toBeLessThanOrEqual(180)
    }
  })

  test("keeps transfer place and waypoint references valid", () => {
    for (const transfer of travelData.transfers) {
      expect(placesById.has(transfer.fromPlaceId)).toBe(true)
      expect(placesById.has(transfer.toPlaceId)).toBe(true)

      const trip = tripsById.get(transfer.tripId)

      if (trip === undefined) {
        throw new TypeError(`Missing transfer trip: ${transfer.tripId}`)
      }

      expect(transfer.date >= trip.start).toEqual(true)
      expect(transfer.date <= trip.end).toEqual(true)

      expect(transfer.legs.length > 0).toEqual(true)

      for (const leg of transfer.legs) {
        expect(leg.mode.length > 0).toEqual(true)

        for (const point of [leg.from, leg.to]) {
          const hasPlace = point.placeId !== undefined
          const hasWaypoint = point.waypointId !== undefined

          expect(hasPlace !== hasWaypoint).toEqual(true)

          if (point.placeId !== undefined) {
            expect(placesById.has(point.placeId)).toEqual(true)
          }

          if (point.waypointId !== undefined) {
            expect(waypointsById.has(point.waypointId)).toEqual(true)
          }
        }
      }
    }
  })

  test("keeps the complete dated timeline sorted and referentially valid", () => {
    expect(travelData.schemaVersion).toEqual(2)
    expect(travelData.coverage.start).toBe("2013-07-28")
    expect(new Set(travelData.timeline.map(event => event.id)).size).toEqual(
      travelData.timeline.length,
    )

    for (const [index, event] of travelData.timeline.entries()) {
      expect(event.start <= event.end).toBe(true)
      expect(event.start >= travelData.coverage.start).toBe(true)
      expect(event.end <= travelData.coverage.end).toBe(true)
      expect(event.placeIds.length).toBeGreaterThan(0)

      for (const placeId of event.placeIds) {
        expect(placesById.has(placeId)).toBe(true)
      }

      const previous = travelData.timeline[index - 1]

      if (previous !== undefined) {
        expect(event.start >= previous.start).toBe(true)
      }
    }
  })

  test("partitions every non-home event into exactly one declared trip", () => {
    const membershipCounts = new Map(
      travelData.timeline.map(event => [event.id, 0]),
    )

    expect(new Set(travelData.trips.map(trip => trip.id)).size).toEqual(
      travelData.trips.length,
    )

    for (const trip of travelData.trips) {
      const events = getEventsForTrip(trip)

      expect(trip.start <= trip.end).toEqual(true)
      expect(events.length).toBeGreaterThan(0)

      for (const event of events) {
        membershipCounts.set(event.id, (membershipCounts.get(event.id) ?? 0) + 1)
      }
    }

    for (const event of travelData.timeline) {
      expect(membershipCounts.get(event.id)).toEqual(
        event.kind === "base" ? 0 : 1,
      )
    }
  })

  test("indexes representative visits for interactive places", () => {
    for (const { placeId, eventId } of [
      { placeId: "new-york-city", eventId: "2014-05-26-new-york-city" },
      { placeId: "denver", eventId: "2022-08-26-denver" },
      { placeId: "longmont", eventId: "2018-08-11-longmont" },
      { placeId: "paris", eventId: "2017-08-07-paris" },
      { placeId: "dunkirk", eventId: "2017-08-13-dunkirk" },
    ]) {
      expect(
        getEventsForPlace(placeId).some(event => event.id === eventId),
      ).toEqual(true)
    }
  })

  test("chooses the dated stay for a timeline date", () => {
    expect(findClosestEvent(isoDateToDayNumber("2023-07-20")).id).toBe(
      "2023-07-05-alanya",
    )
  })

  test("chooses the first dated stay at the start of the timeline", () => {
    expect(findClosestEvent(isoDateToDayNumber("2013-07-28")).id).toEqual(
      "2013-07-28-brest-departure",
    )
  })

  test("treats timeline gaps and home-base records as no-trip days", () => {
    expect(findEventOnDay(isoDateToDayNumber("2014-09-16"))?.id).toEqual(
      "2014-08-31-new-york-city",
    )
    expect(findEventOnDay(isoDateToDayNumber("2014-09-17"))).toEqual(undefined)
    expect(findEventOnDay(isoDateToDayNumber("2025-08-11"))).toEqual(undefined)
    expect(findEventOnDay(isoDateToDayNumber("2026-03-10"))).toEqual(undefined)
  })

  test("does not infer a departure from a nested border run", () => {
    const routes = buildTravelRoutes()
    const abuDhabi = placesById.get("abu-dhabi")
    const kualaLumpur = placesById.get("kuala-lumpur")

    expect(abuDhabi).toBeDefined()
    expect(kualaLumpur).toBeDefined()
    expect(
      routes.some(
        route =>
          route.sourcePosition[0] === abuDhabi?.longitude &&
          route.targetPosition[0] === kualaLumpur?.longitude,
      ),
    ).toBe(false)
  })

  test("connects only events and explicit transfers inside one trip", () => {
    const routes = buildTravelRoutes()

    function requirePlace(placeId: string): TravelPlace {
      const place = placesById.get(placeId)

      if (place === undefined) {
        throw new TypeError(`Missing test place: ${placeId}`)
      }

      return place
    }

    const berlin = requirePlace("berlin")
    const dunkirk = requirePlace("dunkirk")
    const hamburg = requirePlace("hamburg")
    const kazan = requirePlace("kazan")
    const dubai = requirePlace("dubai")
    const istanbul = requirePlace("istanbul")
    const paris = requirePlace("paris")
    const svx = waypointsById.get("svx-airport")

    if (svx === undefined) {
      throw new TypeError("Missing test waypoint: svx-airport")
    }

    function connects(
      source: TravelPlace,
      target: TravelPlace,
    ): boolean {
      return routes.some(
        route =>
          route.sourcePosition[0] === source.longitude &&
          route.sourcePosition[1] === source.latitude &&
          route.targetPosition[0] === target.longitude &&
          route.targetPosition[1] === target.latitude,
      )
    }

    function touchingRoutes(place: TravelPlace) {
      return routes.filter(
        route =>
          (route.sourcePosition[0] === place.longitude &&
            route.sourcePosition[1] === place.latitude) ||
          (route.targetPosition[0] === place.longitude &&
            route.targetPosition[1] === place.latitude),
      )
    }

    expect(routes.every(route => tripsById.has(route.tripId))).toEqual(true)
    expect(connects(hamburg, berlin)).toEqual(true)
    expect(connects(berlin, paris)).toEqual(false)
    expect(connects(paris, berlin)).toEqual(false)
    expect(connects(paris, dunkirk)).toEqual(true)
    expect(connects(dunkirk, paris)).toEqual(true)
    expect(connects(istanbul, kazan)).toEqual(true)

    const kazanRoutes = touchingRoutes(kazan)
    const kazanDepartureRoutes = kazanRoutes.filter(
      route => route.dateStart === "2022-03-04",
    )
    const kazanReturnRoutes = kazanRoutes.filter(
      route => route.dateStart === "2024-08-02",
    )

    expect(kazanDepartureRoutes).toHaveLength(1)
    expect(kazanDepartureRoutes[0]?.tripId).toEqual(
      "2022-2024-continuous-travel",
    )
    expect(kazanDepartureRoutes[0]?.mode).toEqual("plane")
    expect(kazanDepartureRoutes[0]?.sourceLabel).toEqual("Kazan")
    expect(kazanDepartureRoutes[0]?.targetLabel).toEqual("SVX")
    expect(
      kazanDepartureRoutes[0]?.sourcePosition,
    ).toEqual([kazan.longitude, kazan.latitude])
    expect(
      kazanDepartureRoutes[0]?.targetPosition,
    ).toEqual([svx.longitude, svx.latitude])
    expect(kazanReturnRoutes).toHaveLength(1)
    expect(kazanReturnRoutes[0]?.sourceLabel).toEqual("Istanbul")
    expect(kazanReturnRoutes[0]?.targetLabel).toEqual("Kazan")
    expect(kazanReturnRoutes[0]?.mode).toEqual("plane")
    expect(kazanReturnRoutes[0]?.destinationEventId).toEqual(undefined)
    expect(
      routes.some(
        route =>
          route.tripId === "2022-2024-continuous-travel" &&
          route.sourcePosition[0] === svx.longitude &&
          route.sourcePosition[1] === svx.latitude &&
          route.targetPosition[0] === dubai.longitude &&
          route.targetPosition[1] === dubai.latitude,
      ),
    ).toEqual(true)
  })

  test("keeps recorded transport details on every route segment", () => {
    const routes = buildTravelRoutes()
    const busRoutes = routes.filter(route => route.tripId === "2013-europe-bus")
    const kazanTransferRoutes = routes.filter(
      route =>
        route.tripId === "2022-2024-continuous-travel" &&
        route.dateStart === "2022-03-04",
    )

    expect(busRoutes.length > 0).toEqual(true)
    expect(busRoutes.every(route => route.mode === "bus")).toEqual(true)
    expect(kazanTransferRoutes).toHaveLength(2)
    expect(kazanTransferRoutes.every(route => route.mode === "plane")).toEqual(
      true,
    )
    expect(
      kazanTransferRoutes.map(route => [route.sourceLabel, route.targetLabel]),
    ).toEqual([
      ["Kazan", "SVX"],
      ["SVX", "Dubai"],
    ])
    expect(
      kazanTransferRoutes.every(
        route =>
          route.dateStart === "2022-03-04" &&
          route.dateEnd === "2022-03-04",
      ),
    ).toEqual(true)
  })

  test("renders the ABQ to DFW to IST flight as separate legs", () => {
    const routes = buildTravelRoutes()
    const flightRoutes = routes.filter(
      route =>
        route.tripId === "2022-2024-continuous-travel" &&
        route.dateStart === "2022-11-04",
    )

    expect(flightRoutes.map(route => [route.sourceLabel, route.targetLabel])).toEqual([
      ["ABQ", "DFW"],
      ["DFW", "IST"],
    ])
    expect(flightRoutes.every(route => route.mode === "plane")).toEqual(true)
    expect(
      flightRoutes.every(
        route => route.destinationEventId === "2022-11-05-istanbul",
      ),
    ).toEqual(true)
    expect(
      flightRoutes.some(
        route =>
          route.sourceLabel === "Los Alamos" ||
          route.targetLabel === "Istanbul",
      ),
    ).toEqual(false)
  })

  test("renders the Singapore to TPE to SFO to Denver flight as separate legs", () => {
    const routes = buildTravelRoutes()
    const flightRoutes = routes.filter(
      route =>
        route.tripId === "2022-2024-continuous-travel" &&
        route.dateStart === "2022-08-26",
    )

    expect(flightRoutes.map(route => [route.sourceLabel, route.targetLabel])).toEqual([
      ["Singapore", "TPE"],
      ["TPE", "SFO"],
      ["SFO", "Denver"],
    ])
    expect(flightRoutes.every(route => route.mode === "plane")).toEqual(true)
    expect(
      flightRoutes.some(
        route =>
          route.sourceLabel === "Singapore" &&
          route.targetLabel === "Denver",
      ),
    ).toEqual(false)
  })

  test("renders the Nha Trang to SVO to Kazan flight as separate legs", () => {
    const routes = buildTravelRoutes()
    const flightRoutes = routes.filter(
      route =>
        route.tripId === "2025-2026-southeast-asia" &&
        route.dateStart === "2026-03-09",
    )

    expect(flightRoutes.map(route => [route.sourceLabel, route.targetLabel])).toEqual([
      ["Nha Trang", "SVO"],
      ["SVO", "Kazan"],
    ])
    expect(flightRoutes.every(route => route.mode === "plane")).toEqual(true)
  })

  test("routes explicit transfers through their recorded waypoints", () => {
    const routes = buildTravelRoutes()
    const den = waypointsById.get("den-airport")
    const abq = waypointsById.get("abq-airport")

    expect(den).toBeDefined()
    expect(abq).toBeDefined()
    expect(
      routes.some(
        route =>
          route.sourcePosition[0] === den?.longitude &&
          route.targetPosition[0] === abq?.longitude,
      ),
    ).toBe(true)
  })

  test("keeps the 2013 bus itinerary ordered without inventing its return day", () => {
    const busEvents = travelData.timeline.slice(0, 14)
    const returnEvent = busEvents.at(-1)
    const routes = buildTravelRoutes()
    const barcelona = placesById.get("barcelona")
    const lloretDeMar = placesById.get("lloret-de-mar")
    const nice = placesById.get("nice")
    const sanremo = placesById.get("sanremo")

    expect(busEvents.map(event => event.id)).toEqual([
      "2013-07-28-brest-departure",
      "2013-07-28-goczalkowice-zdroj",
      "2013-07-28-brno-overnight",
      "2013-07-29-vienna",
      "2013-07-29-st-margarethen-im-lungau",
      "2013-07-30-verona",
      "2013-07-31-nice",
      "2013-07-31-sanremo-overnight",
      "2013-08-01-barcelona-lloret-de-mar",
      "2013-08-05-chateau-de-chambord",
      "2013-08-05-paris",
      "2013-08-07-strasbourg",
      "2013-08-07-frankfurt-am-main",
      "2013-08-08-brest-return",
    ])
    expect(returnEvent).toBeDefined()
    expect(returnEvent === undefined ? undefined : formatEventDate(returnEvent)).toBe(
      "8 or 9 Aug 2013",
    )
    expect(
      routes.some(
        route =>
          route.sourcePosition[0] === barcelona?.longitude &&
          route.targetPosition[0] === lloretDeMar?.longitude,
      ),
    ).toBe(true)
    expect(
      routes.some(
        route =>
          route.sourcePosition[0] === nice?.longitude &&
          route.targetPosition[0] === sanremo?.longitude,
      ),
    ).toBe(true)
  })

  test("formats compact editorial date ranges", () => {
    expect(formatDateRange("2023-05-02", "2023-11-14")).toBe(
      "2 May — 14 Nov 2023",
    )
    expect(formatDateRange("2022-12-31", "2023-01-02")).toBe(
      "31 Dec 2022 — 2 Jan 2023",
    )
  })
})
