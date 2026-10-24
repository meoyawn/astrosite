---
title: Slop City
description:
  A practical brief for LLM agents rebuilding cities through geographic data,
  building generations, settlement patterns and shared procedural systems.
updated_at: 2026-10-24
published_at: 2026-10-23
---

A city is a system people build to live together. Roads carry people to work
and goods to market. Railways gather distances into a station. Schools,
workshops, homes and places of worship give those journeys their reasons.
Electricity runs through the whole arrangement; trees and water give it room
to breathe. Across the world, people return to many of the same needs. Each
city gives them a different shape.

Those repetitions offer a way to rebuild a city in a browser. Find its shared
patterns, recover their relationships, and let real geography give each
instance its place. A few well-chosen rules can carry the feeling of thousands
of buildings: the rhythm of windows, the roofs above a railway, the schoolyard
behind a familiar fence.

History gives those patterns their layers. A street can hold several generations
of building beside one another, each carrying the materials, ambitions and
ordinary habits of its time. Gardens and small houses give way to apartment
blocks; an old workshop survives beside a new tower. Read those layers together
with the ways people inhabit them, and the city's apparent variety begins to
offer a practical grammar.

Kazan is my hometown, and I live here. My familiarity with the city provides
a practical reference for evaluating its reconstruction as a procedural 3D
world. I worked with an LLM assistant to adapt
[Slop New York](https://mrdoob.github.io/slop-newyork/) to Kazan's geography,
architecture and infrastructure.

The result is available at [kazan.adelnz.com](https://kazan.adelnz.com/), with
source code in
[meoyawn/slop-kazan](https://github.com/meoyawn/slop-kazan).

This article documents that adaptation and serves as an execution brief for
LLM agents rebuilding another city. The goal is a recognizable, explorable
world that runs at a measured 60 frames per second on the intended hardware.
Spend the geometry and development time on silhouettes, materials, movement
and street context that make the place feel inhabited.

To use the brief, supply the city, the source repository, the intended geographic
extent, the target device and browser, and the permitted publication workflow.
Use Slop New York as the default foundation. Inspect the repository's existing
instructions, preserve unrelated work, and record assumptions for inputs that
can be reasonably inferred. Keep source dates, data licences and attribution
requirements with the import. The sections below describe the work to perform;
the Kazan examples illustrate decisions to revisit for the chosen city.

![A helicopter above Slop Kazan's procedurally modeled buildings, roads and parks, with a lake stretching into the distance.](./slop-kazan.png)

## Start with the existing engine

The original is by Ricardo Cabello, better known as mrdoob, the creator of
Three.js. His [Slop New York repository](https://github.com/mrdoob/slop-newyork)
provides the foundation: rendering, procedural buildings and materials,
vegetation, traffic, and exploration on foot, by car, by bicycle and by
helicopter. It also provides a working example of how to fit those systems into
a browser. Keep it available throughout the adaptation, including its ongoing
changes.

For another city, begin by tracing that implementation. Follow its geographic
import, coordinate system, building generation, material families, road graph,
movement and collision. Inspect its instancing, spatial culling and distant
rendering. Record the upstream revision, run the original, and establish a
baseline before changing the city. Create a branch for the adaptation and keep
city-specific geography and style profiles separate from the shared engine.

This inspection matters because the original does not obtain a photographic mesh
of every building from Google Earth. It combines geographic inputs with
procedural shapes, neighborhood profiles, material rules and distinctive
landmarks. The job is to discover which inputs and rules describe the new city,
then fit them into that process.

## Import the geography

Define the coverage before adding geometric detail. Include outer districts,
transport connections, water and the landscape visible from the city. In Kazan,
the opposite Volga bank and the hills at Verkhniy Uslon matter to the view. The
airport, northern districts and eastern hills also belong in the region. A
bounding box around the tourist center would omit much of what makes the city
recognizable.

Build a repeatable geographic import from a cached regional source.
OpenStreetMap supplies building outlines and parts, roads, footways, water and
many infrastructure attributes. Retain construction dates, project-series
identifiers, materials and addresses for the classification that follows.
Large online queries proved unreliable for our region, so we switched to an
offline regional extract. Preserve source dates,
stable object identities and original tags. Project everything into one local
coordinate system with metre units, then compile compact data for the browser.

Preserve polygon holes, courtyards and the relationship between building parts
and their parent outline. Detailed parts must neither duplicate the main volume
nor accidentally erase its uncovered remainder. Retain shared network node
identities as well: they establish connections that geometric proximity alone
cannot reliably recover.

## Count the inventory and work through systems

Before choosing examples to model, count the relevant inventory. Keep the city
boundary separate from the wider landscape extract. Report physical sites,
building outlines, building parts and point features separately, linking records
that describe the same place. A religious complex can contain several buildings
and several mapped points. An affiliated school still needs the school family.
Use original tags and reviewed evidence to resolve classification; retain
ambiguous cases explicitly.

For each system, record the eligible inventory, supported families, generated
instances, fallbacks and unresolved records. Official totals can reveal gaps,
but compare like units and boundaries before reporting coverage. A count of
congregations and a count of mapped buildings answer different questions.
Report missing data so the next agent can distinguish an import gap from an
unfinished generator.

Keep an ordered work queue in the repository. Make recurring tasks large enough
to improve a whole category: school grounds, indoor arenas, open stadiums,
mosques, railway equipment or filling stations. Work on one system at a time,
with dependencies such as terrain and network connectivity established first.
Use this loop:

1. Inventory and classify the system. For buildings, combine generation,
   settlement or building type, and local construction family. Identify the
   data that can drive dimensions, layout, materials and access rules.
2. Select a small, varied reference sample covering the principal forms,
   footprint sizes and contexts. Record what is observed and what is estimated.
3. Build shared components and layout rules. Feed them actual site geometry,
   building parts, heights, tags and a local style profile.
4. Apply those rules across every eligible record. Keep conservative fallbacks
   and an explicit list of unsupported cases.
5. Audit the full inventory for invalid dimensions, duplicates, overlaps and
   omissions. Inspect representative street and aerial views, exercise movement
   and revisit streamed areas. Measure dense scenes when the change affects
   rendering cost.
6. Finish the coherent batch, run the relevant checks, commit and push through
   the authorized workflow, and record publication status immediately. Begin
   the next queued task while CI and publication proceed; verify the served
   result alongside that work.

Define completion before adding detail: the principal volumes and silhouette,
characteristic materials, essential grounds and access, coverage accounting,
representative visual checks and an acceptable rendering cost. Fix defects
that affect the family in the shared rule. Keep fine ornament, hidden elevations
and uncertain photographic details as follow-ups. A distinctive landmark may
justify a bounded custom profile; finish its recognizable exterior and grounds
before returning to the queue. Improve recurring buildings visible in the
background through their families too.

## Resolve heights and terrain

Give every building height a source. Use explicit mapped heights and reviewed
published dimensions first. Where those are absent, use mapped storeys with an
explicit floor-height estimate, then an appropriate height dataset, then a
conservative fallback based on type and footprint. Our supplementary source is
[GlobalBuildingAtlas](https://github.com/zhu-xlab/GlobalBuildingAtlas). Its
heights are satellite-derived predictions. Check raster alignment and sample
within each footprint; retain uncertainty and the method used. Reviewed
photographic estimates can refine uncertain dimensions, but must remain
distinguishable from measurements.

Missing height data deserves particular care. A single fallback height can
distort the city's distribution of low-rise buildings, slabs and towers.
Condition estimates on building type, footprint and available storey data, and
check the resulting distributions across districts. Preserve raised parts and
minimum heights. Keep planned completed buildings separate from the construction
stage actually present on the ground.

Terrain must participate in the whole world. We used
[FABDEM](https://research-information.bris.ac.uk/en/datasets/fabdem-v1-2/) for
ground elevation and checked characteristic hills against independent
references. Record the source resolution and vertical datum. A finer display
mesh interpolates the available measurements; it cannot establish the shape of
an unmapped stairwell or retaining wall. Use consistent surfaces for terrain,
foundations, roads, roots, vehicle wheels, walking and collision. Keep
foundations level, fill their downhill gaps, and preserve real shorelines and
islands. Fit water surfaces and adjacent shore terrain consistently so lakes
meet their banks visibly. Check several shore shapes and slopes when fixing a
buried water surface; carry the correction through the shared water and terrain
rules.

## Recover the building generations

Pull construction dates before assigning architectural families across the city.
Begin with mapped dates and the region's public building or housing registers,
technical passports, heritage inventories and catalogues of standard plans.
For Russian housing, the
[GIS ЖКХ house-register documentation](https://cdn.dom.gosuslugi.ru/webhelp/topics/houses/och/r_card-och.html)
lists construction and commissioning years, reconstruction year and project
series among the available fields; completeness varies by record. Seek the
equivalent sources for the chosen country and city. Cache available exports and
record the source and retrieval date so this enrichment can be repeated.

Join those records to mapped buildings using stable identifiers where possible,
then normalized addresses and spatial agreement. Keep unresolved and conflicting
matches visible. Store the construction year or interval, its source, the
meaning of the date, the plan series and the confidence of the match. Keep
renovation and recladding dates separately. Check what an
[OSM start date](https://wiki.openstreetmap.org/wiki/Key:start_date)
describes when several uses share an object: an institution's opening may refer
to a different event from the construction of its building.

Use this chronology to divide the inventory into local building generations.
For stock before the twentieth century, start with broad century bands and
split them where a visible architectural transition justifies it. In the
twentieth century, begin with decades and known plan series, refining the
groups against the city's actual construction history. Keep decade groups for
recent development too. Count the buildings in each cohort and the records
whose age remains unknown before choosing which generators to build first.

For a city with Soviet housing stock, investigate the local Khrushchev-era
families, later panel slabs and towers, and post-Soviet brick and mixed-material
developments. Verify the dates and forms through local registers and plan
catalogues. Let a known series and observed structure refine a broad era label;
several construction systems can coexist in one decade. Preserve those
distinctions in the family selection.

For each substantial cohort, inspect a bounded sample of aerial and street
views matched to footprints. Recover its whole form language: massing and wing
arrangement, storey and floor heights, roof pitch and parapets, stair cores,
window rhythm and recesses, balconies or loggias, entrance spacing, plinths,
cornices and characteristic material zones. A generation supplies rules for
the building's shape and proportions as well as its facade. Record later
alterations as an appearance layer over the original form where appropriate.

When dates are missing, use an identified plan series or supported morphological
match to select a family. Record that assignment as inferred and keep an unknown
construction date unknown. Use a conservative fallback when the evidence is
weak. Date coverage and family coverage should remain separately measurable.

## Read how people inhabit the city

Generations intersect with settlement patterns. Within the same period, a
garden plot, a large detached house and an apartment block need different
generators and different grounds. Enrich the inventory with mapped land use,
plot boundaries, housing type, density and available municipal or census data.
Published neighborhood statistics on population, dwelling types or property
values can help identify areas to investigate. Retain their dates and geographic
units, and keep the observed building and plot as the controls for each layout.

Look for recurring combinations such as these, adapting them to local evidence:

| Settlement or building family | Geometry and context to recover |
| --- | --- |
| Dacha and garden plots | Small houses, plot subdivisions, garden space, outbuildings, fences and narrow access lanes; local roof and wall variants. |
| Large detached houses | Actual building size, multiple wings, roof forms, setbacks, garages, driveways, enclosed grounds and planting. |
| Standard apartment blocks, including panel families | Plan series, slab or tower form, repeated entrances, panel or brick layout, balconies, shared courtyards and service access. |
| Apartment complexes | Mapped buildings and parts, common grounds or podiums, parking, entrances, paths and connections to surrounding streets. |
| Older street-front housing | Building lines, attached or detached volumes, courtyard passages, shopfronts where supported, roof and cornice rhythms. |

Use socioeconomic aggregates to inform district context and sampling. Keep their
scale intact: a neighborhood average does not establish an individual household's
income. Store physical categories such as detached housing, garden plots or
apartment blocks, together with any independently sourced economic context.
Preserve mixtures and transitions within districts.

The working classification is generation, building or settlement type, and local
plan or material family. A known panel series can reuse its volume and facade
rules across the city; a detached house from the same decade follows another
family. Actual footprints, heights, plots and appearance evidence give each
instance its parameters. Apply that classification across the inventory and
report coverage by generation, type and district.

## Turn the cohorts into generators

Keep a compact profile for each family: eligible generations and types, known
plan series, form and facade parameters, material zones, grounds rules, source
references and fallbacks. Feed it the mapped footprint, parts, height and site
context. Share the rules across all matches while preserving those instance
inputs. Build the common, well-supported families first and keep rare or
ambiguous forms in the coverage report.

Test the first families in a small area containing several generations and
housing types, plus commercial or public buildings and some infrastructure.
Check street views, aerial views and the skyline. Refine the rules against
several examples with different footprints, orientations and storey counts.
Distinguish a wrong cohort assignment from a defect shared by its generator.

Represent recurring architecture through parameterized families. Kazan has white
silicate brick, white brick with red inserts, painted panels, plaster, glazing
and repeated balcony arrangements. A white-and-red facade needs separate wall
and accent zones. Store colours, bay spacing, floor bands, balcony glazing and
plinths as data, with shared shaders and geometry. Select families using mapped
attributes, reviewed photographs and verified project groups. Keep inferred
assignments explicit. A construction year or district name alone does not
establish every building's paint. Use satellite colour evidence when available,
keeping roof samples separate from facade observations and estimates. A
predicted height dataset does not supply measured wall colours.

Generate the main volumes from footprints and building parts, then derive
facades from floor heights, bay spacing and wall orientation. Place repeated
windows, balconies and entrances through those rules. Parameterize roofs,
columns, arches and domes as reusable components, with dimensions and placement
supplied by the building profile. Keep volume generation, facade layout and
material selection separate so each system can evolve without duplicating the
others.

Public schools offer another use for generation and plan-series data. Compare
footprint layouts and storey counts while allowing rotation and reflection to
identify schools built from the same plan. A procedural family can reuse wing
arrangements, classroom-window rhythms and panel layouts, with paint and
entrance details supplied as parameters. Validate family selection against
mapped footprints and reference photographs so errors in assignment can be
distinguished from errors in the generator. Use the same approach for other
recurring building types.

For Bangkok, Istanbul or another city, derive the generations and settlement
types from its own history and data. Reuse the method of classification,
sampling and parameterization. Find the local repetition in facade elements,
building forms, street frontages and block layouts, then test how much of a
representative district those rules can reproduce.

## Use references to answer a modeling question

Bring in theory when it helps define a rule. Christopher Alexander and his
collaborators'
[A Pattern Language](https://www.patternlanguage.com/apl/aplsummary.htm)
spans towns, buildings and construction. Its index lets an agent look up a
particular relationship, from transport and industrial areas to entrances,
street windows and lighting. Compare the relevant pattern with local evidence,
then extract components and layout constraints for the generator.

Jane Jacobs's
[The Death and Life of Great American Cities](https://www.penguinrandomhouse.ca/books/86058/the-death-and-life-of-great-american-cities-by-jane-jacobs/9780679644330/excerpt)
is useful for observing how street uses support one another. Her
[The Economy of Cities](https://www.penguinrandomhouse.com/books/86059/the-economy-of-cities-by-jane-jacobs/9780394705842/)
offers questions about production and trade. For this reconstruction, use those
questions to inspect entrances, destinations, loading edges and their
connections. Keep the city's observed layout as the authority for placement.

For physical components, consult local building catalogues, street manuals,
operator diagrams and representative photographs. Sources such as
[NACTO's illustrated street elements](https://nacto.org/publication/urban-street-design-guide/street-design-elements/),
[OSM's railway attributes](https://wiki.openstreetmap.org/wiki/Key:railway)
and [street-lamp attributes](https://wiki.openstreetmap.org/wiki/Tag:highway=street_lamp)
can help identify the inputs to seek. Check dimensions and forms against local
evidence. End each lookup with a recorded modeling decision and its uncertainty.

When movement needs a shared model, useful implementation references include
Andrew Willmott's 2012
[Inside GlassBox talk on SimCity's simulation architecture](https://www.andrewwillmott.com/talks/inside-glassbox)
and Colossal Order's 2023 Cities: Skylines II diaries on
[traffic](https://colossalorder.fi/news/development-diary-2-traffic-ai/)
and [production](https://colossalorder.fi/news/development-diary-9-economy-production/).
Borrow a focused idea about connections or flows when it improves visible
behavior. Keep simulation work within the rendering budget and the active
reconstruction task.

## Generate buildings with their grounds

A reusable family includes the space around the building and the way people
reach it. Use one site description for visible geometry, collision, pedestrian
access, traffic restrictions, vegetation exclusions and distant rendering.
Preserve the mapped boundary, all building footprints, existing activities and
entrances. Fit generated additions into the remaining space with clearances
from buildings and routes. When a boundary is unknown, limit additions to
supported space and record the uncertainty.

For school grounds, subtract buildings, paths, service access and mapped
equipment from the territory. Find usable regions, then fit appropriately sized
football or hockey courts, exercise bars and other locally typical activities
where geometry permits. Keep mapped facilities first. Derive orientation and
placement from the territory and the school's position within it. Stable inputs
must produce a stable layout. A cramped school can have a modest yard; fitting
every activity into every site would destroy the relationship to real space.
Kindergartens can reuse the fitting machinery with a separate palette of small
play areas, sandpits, low equipment and rain shelters. Preserve service access
while keeping ambient through traffic out of both kinds of grounds.

For sports facilities, share an enclosed-hall family across suitable hockey,
basketball and other indoor arenas, with footprint, height, roof span, glazing
and entrance parameters. Use another family for open stadiums: a mapped playing
surface, available stands, the bowl or partial seating, and supported roof
coverage. Keep smaller fields and detached stands as separate configurations.
Apply these families across the inventory and inspect the main variants. Let
the sport and available geometry determine which features are justified.

For religious buildings, sample the city's actual traditions and derive their
repeated forms and palettes. Kazan's Tatar mosques suggest families of prayer
halls, roofs, domes and minarets; another city's references will give different
proportions and colours. Orthodox churches and cathedrals suggest connected
volumes for the nave, sanctuary, entrance or refectory, bell tower, drums and
domes. Infer relationships cautiously from the footprint and building parts;
preserve mapped towers and orientation, using a traditional altar direction
only as an explicit fallback. Religious tags alone do not establish the use of
every building in a monastery or campus. Keep chapels, schools, residences and
service buildings distinct while generating coherent grounds for the complex.

Industrial sites need families too. Classify the supported forms, such as
workshops, large production halls, warehouses, utility buildings and offices.
Use their footprints, heights, repeated bays, roof forms and visible loading
edges to parameterize them. Place stacks, tanks and other process equipment
where supported by mapped objects or reviewed references. Retain the relationship
between a hall, its loading yard, service roads and any mapped rail siding.
This lets a factory read as a working complex while keeping its repeated
structure inexpensive to generate.

## Generate vegetation

Extend the original vegetation system to suit the local landscape. Kazan needed
wooded slopes and extensive greenery alongside its parks. We used
[ESA WorldCover](https://esa-worldcover.org/en) and mapped land use to guide
deterministic placement. Make trees follow terrain and remain stable when an
area is revisited. Exclude buildings, roads, water, parking, airport pavement,
railway corridors and overhead lines with suitable clearance. Apply the same
exclusions to detailed trees and distant canopy. A corrected wooded hill should
improve the rules for other wooded hills too.

## Connect infrastructure

Infrastructure needs connected geometry and appropriate levels. Build road
connectivity from shared mapped nodes and retain one-way, lane, bridge, tunnel
and layer attributes. Two lines crossing on a map may pass at different heights.
Layers establish relative order; missing clearances and approach gradients
require explicit estimates. Use the same profiles for the road surface, traffic
and player movement.

Generate continuous bridge decks, connected approaches, medians, supports and
open tunnel portals. Keep columns clear of lower roads and paths. Drive over and
under representative crossings to check them. A convincing surface still fails
if traffic follows a different elevation or a tunnel entrance has solid ground
covering its opening.

Keep heavy rail, trams and electrical networks distinct from the road graph. Our
railway and tram systems use mapped tracks with procedural rails, sleepers,
platforms and overhead equipment. The power-line system preserves connected
supports and spans, with shared families for poles, pylons and sagging
conductors. Check clearances against terrain and other structures. An electrical
crossing without a shared node must not create a connection, and buried cables
must not become overhead wires.

Apply the same inventory-and-family process to recurring facilities. Parking
areas, courtyards, campuses and promenades need different traffic rules from
public through streets. Retain their access geometry while excluding
inappropriate ambient through traffic. Split ways at actual boundaries so the
public approaches remain connected. A bounded number of stationary cars can
communicate parking without turning every aisle into an arterial road.

Airports need separate runway, taxiway and apron surfaces and markings. Filling
stations need mapped sites, canopies, pumps, shops and access. Reuse a few
components with size and layout variations; add brand colours only when the
data already supports them. Pedestrian bridges and underground entrances need
connected stairs, ramps, decks, openings and railings fitted to each location.
Generate these facilities from shared component families, using mapped
dimensions, connectivity and elevation to control their layout. Retain unknowns
and test several representative configurations before extending coverage.

Generate street furniture with the same discipline. Prefer mapped lamp positions;
where coverage is missing, use a locally informed spacing rule along eligible
street edges, marking the placement as inferred. Avoid junctions, entrances and
clear walking routes. Share poles, arms, fixtures and sign supports. Carry
the light's visible colour and shape through cheap emissive materials, with a
bounded set of nearby lights where illumination matters. Preserve a coherent
night scene without giving each fixture its own expensive shadow.

People make the connections legible. If the engine supports pedestrians, use a
bounded pool following connected walkable routes between supported destinations.
Grounds and street fronts should influence where activity appears. Simple
profiles can suggest school arrival, shopping or an evening promenade; label
their timings and densities as estimates. Keep movement plausible around gates,
crossings and transit stops. Shared human needs provide useful defaults, while
local access rules and observations supply the variations.

## Render and validate the world

Preserve the original's rendering discipline as the systems grow. Share
materials, instance repeated components, group static geometry spatially, cull
unseen regions and dispose of streamed detail. Carry wall colours, window
coverage, accents and roof materials into distant buildings, with the original's
atmospheric perspective. Carry characteristic geometry such as minarets, bell
towers and stadium roofs into the distant silhouette as well. Give generated
parts clear ownership when a site streams in and out. Avoid a separate mesh or
material for every window, sleeper or brick. Check both street views and the
skyline, and measure representative dense scenes on the intended hardware with
60 rendered frames per second as the target. Record the device, build, camera
route and actual game
renders over wall time. Measure with tracing stopped and a single game preview
running. Keep loading, builds and tests out of the measurement interval. If the
target hardware is unavailable, report that limit and retain the measurement
as unfinished work.

Iterate inside the running world. We used JavaScript, Vite hot reload, aube and
browser automation, reusing one development server and one Chromium instance.
Use the project's existing tools and preview where available. Connect browser
automation or diagnostics to capture matching views and exercise movement.
Geometry and data checks complement visual inspection on the target renderer.
Check behaviour alongside screenshots: walk through a gate, enter a campus,
cross a bridge and return to a streamed
district. Inspect near and distant surfaces before and after camera movement,
teleports and return travel. Look for missing roofs, stale instances, overlapping
detail, flicker and z-fighting. Add focused regressions where a failure could
recur across the city.

## Leave the next step clear

Keep the work queue's active task, completed work, remaining requests and
photographic follow-ups distinct. For every batch, record the family changed,
inventory coverage, representative checks, remaining exceptions, commit and
publication state. A pushed commit can have a deployment pending; mark delivery
after verifying the served version. If publication fails, keep the batch's
status accurate and repair the failure. Continue useful independent work while
an asynchronous job runs.

Keep the import commands, source dates, attribution, classification rules,
family parameters and verification routes reproducible in the repository. The
next agent should be able to regenerate the world, explain an estimated colour,
find an unsupported site and take the next queued task without reconstructing
the conversation. Report the measured performance and its limits alongside the
remaining scope.

The
[Kazan data notes](https://github.com/meoyawn/slop-kazan/blob/feat/kazan-tatarstan/docs/kazan-data.md)
record the sources, estimates and reproducible pipeline for this adaptation.
