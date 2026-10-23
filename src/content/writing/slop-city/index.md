---
title: Slop City
description: A process for recreating arbitrary cities as procedural 3D worlds, starting from mrdoob's Slop New York.
updated_at: 2026-10-23
---

I wanted to fly around Kazan, so I asked an LLM assistant to adapt
[Slop New York](https://mrdoob.github.io/slop-newyork/). You can explore our
version at [kazan.adelnz.com](https://kazan.adelnz.com/) and read the code in
[meoyawn/slop-kazan](https://github.com/meoyawn/slop-kazan).

The original is by Ricardo Cabello, better known as mrdoob, the creator of
Three.js. His [Slop New York repository](https://github.com/mrdoob/slop-newyork)
provides the foundation: rendering, procedural buildings and materials,
vegetation, traffic, and exploration on foot, by car, by bicycle and by
helicopter. It also provides a working example of how to fit those systems
into a browser. Keep it available throughout the adaptation, including its
ongoing changes.

For another city, begin by tracing that implementation. Follow its geographic
import, coordinate system, building generation, material families, road graph,
movement and collision. Inspect its instancing, spatial culling and distant
rendering. Record the upstream revision, run the original, and establish a
baseline before changing the city. Create a branch for the adaptation and
keep city-specific geography and style profiles separate from the shared
engine.

This inspection matters because the original does not obtain a photographic
mesh of every building from Google Earth. It combines geographic inputs with
procedural shapes, neighborhood profiles, material rules and distinctive
landmarks. The job is to discover which inputs and rules describe the new
city, then fit them into that process.

Define the coverage before detailing individual buildings. Include outer
districts, transport connections, water and the landscape visible from the
city. In Kazan, the opposite Volga bank and the hills at Verkhniy Uslon matter
to the view. The airport, northern districts and eastern hills also belong
in the region. A bounding box around the tourist center would omit much of
what makes the city recognizable.

Build a repeatable geographic import from a cached regional source.
OpenStreetMap supplies building outlines and parts, roads, footways, water
and many infrastructure attributes. Large online queries proved unreliable
for our region, so we switched to an offline regional extract. Preserve
source dates, licenses, stable object identities and original tags. Project
everything into one local coordinate system with metre units, then compile
compact data for the browser.

Preserve polygon holes, courtyards and the relationship between building
parts and their parent outline. Detailed parts must neither duplicate the
main volume nor accidentally erase its uncovered remainder. Retain shared
network node identities as well: they establish connections that geometric
proximity alone cannot reliably recover.

Give every building height a source. Use explicit mapped heights and
reviewed published dimensions first. Where those are absent, use mapped
storeys with an explicit floor-height estimate, then an appropriate height
dataset, then a conservative fallback based on type and footprint. Our
supplementary source is
[GlobalBuildingAtlas](https://github.com/zhu-xlab/GlobalBuildingAtlas).
Its heights are satellite-derived predictions. Check raster alignment and
sample within each footprint; retain uncertainty and the method used.
Reviewed photographic estimates can refine uncertain dimensions, but must
remain distinguishable from measurements.

Missing height data deserves particular care. An early fallback turned
small retail pavilions on Musina into four-storey towers. Lower estimates
fixed those structures, but absence of a height tag still does not establish
that an arbitrary building is a kiosk. Preserve mapped storeys, raised parts
and minimum heights. Keep planned completed buildings separate from the
construction stage actually present on the ground.

Terrain must participate in the whole world. We used
[FABDEM](https://research-information.bris.ac.uk/en/datasets/fabdem-v1-2/)
for ground elevation and checked characteristic hills against independent
references. Record the source resolution and vertical datum. A finer display
mesh interpolates the available measurements; it cannot establish the shape
of an unmapped stairwell or retaining wall. Use consistent surfaces for
terrain, foundations, roads, roots, vehicle wheels, walking and collision.
Keep foundations level, fill their downhill gaps, and preserve real
shorelines and islands.

Before modeling hundreds of facades, study how the city repeats itself.
For another city, I would start by comparing several skyline, aerial and
street photographs from different districts. Skylines can suggest recurring
slabs, towers, rooflines and height distributions. Closer photographs resolve
materials, windows, balconies and entrances. Match those views to mapped
footprints, then describe the parameters needed to generate each recurring
type at the individual-building level.

Treat that initial classification as an experiment. Generate a small area
containing ordinary housing, commercial and public buildings, plus some
terrain or infrastructure. Compare it from several viewpoints and check
additional photographs before expanding the rules. Ask someone who knows
the city to review uncertain identities and materials. In Kazan, we often
found the reusable family only after correcting a particular building;
investigating it earlier should make the next adaptation more deliberate.

Represent recurring architecture through parameterized families. Kazan has
white silicate brick, white brick with red inserts, painted panels, plaster,
glazing and repeated balcony arrangements. A white-and-red facade needs
separate wall and accent zones. Store colours, bay spacing, floor bands,
balcony glazing and plinths as data, with shared shaders and geometry.
Select families using mapped attributes, reviewed photographs and verified
project groups. Keep inferred assignments explicit. A construction year or
district name alone does not establish every building's paint.

Repeated public buildings can share structural rules too. After reviewing
Gymnasium 155, we compared other school footprints and storeys, allowing
rotation and reflection. Matching the building form lets several schools
reuse classroom-window and panel rules while retaining their own paint and
entrance details. Distinctive landmarks still need recognizable silhouettes;
their columns, arches, domes and roof components can share generators.

When using a reference photograph, account for every visible building,
including the background. Keep a scene checklist tied to mapped identities
and source URLs. Resolve ambiguous matches through more views, and retain
obscured details as follow-ups. Local feedback repeatedly corrected our
building identities as well as our colours. Kishmish belonged to a separate
corner building beside the commercial row; the rounded building behind it
was a multi-storey garage. Correcting a facade on the wrong footprint would
never make that scene accurate.

Extend the original vegetation system to suit the local landscape. Kazan
needed wooded slopes and extensive greenery alongside its parks. We used
[ESA WorldCover](https://esa-worldcover.org/en) and mapped land use to guide
deterministic placement. Make trees follow terrain and remain stable when
an area is revisited. Exclude buildings, roads, water, parking, airport
pavement, railway corridors and overhead lines with suitable clearance.
Apply the same exclusions to detailed trees and distant canopy. A corrected
wooded hill should improve the rules for other wooded hills too.

Infrastructure needs connected geometry and appropriate levels. Build road
connectivity from shared mapped nodes and retain one-way, lane, bridge,
tunnel and layer attributes. Two lines crossing on a map may pass at
different heights. Layers establish relative order; missing clearances and
approach gradients require explicit estimates. Use the same profiles for
the road surface, traffic and player movement.

Generate continuous bridge decks, connected approaches, medians, supports
and open tunnel portals. Keep columns clear of lower roads and paths. Drive
over and under representative crossings to check them. A convincing surface
still fails if traffic follows a different elevation or a tunnel entrance
has solid ground covering its opening.

Keep heavy rail, trams and electrical networks distinct from the road graph.
Our railway and tram systems use mapped tracks with procedural rails,
sleepers, platforms and overhead equipment. The power-line system preserves
connected supports and spans, with shared families for poles, pylons and
sagging conductors. Check clearances against terrain and other structures.
An electrical crossing without a shared node must not create a connection,
and buried cables must not become overhead wires.

Apply the same inventory-and-family process to recurring facilities. Parking
areas, courtyards, campuses and promenades need different traffic rules
from public through streets. Retain their access geometry while excluding
inappropriate ambient through traffic. Split ways at actual boundaries so
the public approaches remain connected. A bounded number of stationary cars
can communicate parking without turning every aisle into an arterial road.

Airports need separate runway, taxiway and apron surfaces and markings.
Filling stations need mapped sites, canopies, pumps, shops and access, with
a shared registry for network branding. Pedestrian bridges and underground
entrances need connected stairs, ramps, decks, openings and railings fitted
to each location. Inventory these components before generating them, retain
unknowns, and test several representative sites. The
[recent Kazan commits](https://github.com/meoyawn/slop-kazan/commits/feat/kazan-tatarstan/)
include rail batching and restored fuel-station source coverage. Station
rendering and branding, followed by pedestrian crossings, are the next
applications of this process.

Preserve the original's rendering discipline as the systems grow. Share
materials, instance repeated components, group static geometry spatially,
cull unseen regions and dispose of streamed detail. Carry wall colours,
window coverage, accents and roof materials into distant buildings, with
the original's atmospheric perspective. Avoid a separate mesh or material
for every window, sleeper or brick. Check both street views and the skyline,
and measure representative dense scenes on the intended hardware with
60 rendered frames per second as the target.

Iterate inside the running world. We used JavaScript, Vite hot reload, aube
and browser automation, reusing one development server and one Chromium
instance. Connect Playwright or browser diagnostics to capture matching
views and exercise movement. CPU rendering can help inspect geometry;
measure GPU performance on the target hardware separately. Check behaviour
alongside screenshots: walk through a gate, enter a campus, cross a bridge
and return to a streamed district. Add focused regressions where a failure
could recur across the city.

Keep the work queue in the repository, with active, completed and remaining
work, plus unresolved photographic details. Finish one coherent system or
site at a time, run the relevant checks, commit, and deploy through the
authorized workflow. Verify the served result before recording delivery.
When a local correction reveals a repeated mistake, update the generation
rule and check its other instances.

Keep data licenses alongside these decisions. Slop New York's code is MIT
licensed; imported datasets retain their own terms. Our Kazan data includes
noncommercial height and terrain sources, which suited this project. Check
those choices against the intended use before building another city's
import. The
[Kazan data notes](https://github.com/meoyawn/slop-kazan/blob/feat/kazan-tatarstan/docs/kazan-data.md)
record the sources, estimates and reproducible pipeline.
