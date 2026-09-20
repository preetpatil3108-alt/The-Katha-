/**
 * THE KATHA - Modern City District & Grand Highway System
 *
 * Professional 3D urban and civil engineering open-world module:
 * 1. Grand National Highway (NH-65) connecting Rangastalam to Metropolis City
 *    - Dual carriageway with 4 traffic lanes, double yellow median, dashed white lane dividers
 *    - Galvanized steel W-beam guardrails and New Jersey concrete safety barriers
 *    - Highway solar streetlights, high-mast LED poles, overhead gantry signboards
 *    - Sloped embankments and pedestrian sidewalk linking village to city
 * 2. Modern City District (Metropolis Tech & Residential Zone)
 *    - Contemporary residential villas with balconies, solar panels, and carports
 *    - Small commercial buildings, IT offices, and civic center
 *    - Street-level shops: CityMart Supermarket, Café Vista with outdoor patio, TechWorld
 *    - Full urban road network with 4-way intersection, zebra crosswalks, traffic signals
 *    - Elevated sidewalks with tactile paving, painted yellow/black curbs, cast-iron tree grates
 *    - Urban details: Bus shelter, ATM kiosk, fire hydrants, recycling bins, billboard, road signs
 */

import * as THREE from 'three';
import { CollisionSystem } from '../collisions/CollisionSystem';

export class ModernCityAndHighway {
  public group: THREE.Group;
  private collisionSystem: CollisionSystem;
  public streetLights: THREE.PointLight[] = [];

  // Material Palette (High visual contrast with traditional village)
  private matAsphalt: THREE.MeshLambertMaterial;
  private matAsphaltMarkingWhite: THREE.MeshLambertMaterial;
  private matAsphaltMarkingYellow: THREE.MeshLambertMaterial;
  private matConcreteCurbs: THREE.MeshLambertMaterial;
  private matCurbStripeYellow: THREE.MeshLambertMaterial;
  private matCurbStripeBlack: THREE.MeshLambertMaterial;
  private matSidewalkTile: THREE.MeshLambertMaterial;
  private matGuardrailSteel: THREE.MeshStandardMaterial;
  private matJerseyBarrier: THREE.MeshLambertMaterial;
  private matBrassAccent: THREE.MeshStandardMaterial;

  // Architectural Materials
  private matVillaWallWhite: THREE.MeshLambertMaterial;
  private matVillaWallCharcoal: THREE.MeshLambertMaterial;
  private matTimberAccent: THREE.MeshLambertMaterial;
  private matSolarPanel: THREE.MeshStandardMaterial;
  private matBuildingOfficeGlass: THREE.MeshStandardMaterial;
  private matBuildingConcrete: THREE.MeshLambertMaterial;
  private matShopFacadeBlue: THREE.MeshLambertMaterial;
  private matShopFacadeGreen: THREE.MeshLambertMaterial;
  private matShopAwning: THREE.MeshLambertMaterial;
  private matGlassPanel: THREE.MeshStandardMaterial;
  private matMetalFrame: THREE.MeshLambertMaterial;
  private matGlowLamp: THREE.MeshBasicMaterial;
  private matTrafficRed: THREE.MeshBasicMaterial;
  private matTrafficAmber: THREE.MeshBasicMaterial;
  private matTrafficGreen: THREE.MeshBasicMaterial;

  // Urban Nature
  private matUrbanTreeTrunk: THREE.MeshLambertMaterial;
  private matUrbanTreeFoliage: THREE.MeshLambertMaterial;
  private matJacarandaFoliage: THREE.MeshLambertMaterial;
  private matHedgeGreen: THREE.MeshLambertMaterial;
  private matLawnGrass: THREE.MeshLambertMaterial;
  private matEmbankmentGravel: THREE.MeshLambertMaterial;

  constructor(collisionSystem: CollisionSystem) {
    this.collisionSystem = collisionSystem;
    this.group = new THREE.Group();
    this.group.name = 'modern_city_and_highway';

    // Civil engineering materials
    this.matAsphalt = new THREE.MeshLambertMaterial({ color: '#121212' }); // Pure deep black clean asphalt
    this.matAsphaltMarkingWhite = new THREE.MeshLambertMaterial({ color: '#f8fafc' });
    this.matAsphaltMarkingYellow = new THREE.MeshLambertMaterial({ color: '#eab308' });
    this.matConcreteCurbs = new THREE.MeshLambertMaterial({ color: '#78716c' });
    this.matCurbStripeYellow = new THREE.MeshLambertMaterial({ color: '#eab308' });
    this.matCurbStripeBlack = new THREE.MeshLambertMaterial({ color: '#1c1917' });
    this.matSidewalkTile = new THREE.MeshLambertMaterial({ color: '#a8a29e' }); // Modern paver slabs
    this.matGuardrailSteel = new THREE.MeshStandardMaterial({
      color: '#cbd5e1',
      metalness: 0.65,
      roughness: 0.35,
    });
    this.matJerseyBarrier = new THREE.MeshLambertMaterial({ color: '#94a3b8' });
    this.matBrassAccent = new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.7, roughness: 0.3 });

    // Modern architectural materials
    this.matVillaWallWhite = new THREE.MeshLambertMaterial({ color: '#f1f5f9' });
    this.matVillaWallCharcoal = new THREE.MeshLambertMaterial({ color: '#334155' });
    this.matTimberAccent = new THREE.MeshLambertMaterial({ color: '#b45309' }); // Teak louvers
    this.matSolarPanel = new THREE.MeshStandardMaterial({
      color: '#1e3a8a',
      metalness: 0.7,
      roughness: 0.25,
    });
    this.matBuildingOfficeGlass = new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      metalness: 0.85,
      roughness: 0.15,
      transparent: true,
      opacity: 0.85,
    });
    this.matBuildingConcrete = new THREE.MeshLambertMaterial({ color: '#64748b' });
    this.matShopFacadeBlue = new THREE.MeshLambertMaterial({ color: '#0284c7' });
    this.matShopFacadeGreen = new THREE.MeshLambertMaterial({ color: '#15803d' });
    this.matShopAwning = new THREE.MeshLambertMaterial({ color: '#dc2626' });
    this.matGlassPanel = new THREE.MeshStandardMaterial({
      color: '#e0f2fe',
      transparent: true,
      opacity: 0.55,
      roughness: 0.1,
    });
    this.matMetalFrame = new THREE.MeshLambertMaterial({ color: '#0f172a' });
    this.matGlowLamp = new THREE.MeshBasicMaterial({ color: '#fef08a' }); // Bright streetlight LED
    this.matTrafficRed = new THREE.MeshBasicMaterial({ color: '#ef4444' });
    this.matTrafficAmber = new THREE.MeshBasicMaterial({ color: '#f59e0b' });
    this.matTrafficGreen = new THREE.MeshBasicMaterial({ color: '#10b981' });

    // Landscaping materials
    this.matUrbanTreeTrunk = new THREE.MeshLambertMaterial({ color: '#44403c' });
    this.matUrbanTreeFoliage = new THREE.MeshLambertMaterial({ color: '#16a34a' });
    this.matJacarandaFoliage = new THREE.MeshLambertMaterial({ color: '#818cf8' }); // Purple bloom
    this.matHedgeGreen = new THREE.MeshLambertMaterial({ color: '#15803d' });
    this.matLawnGrass = new THREE.MeshLambertMaterial({ color: '#22c55e' });
    this.matEmbankmentGravel = new THREE.MeshLambertMaterial({ color: '#57534e' });
  }

  public build(): void {
    // 1. Grand Multi-lane National Highway (NH-65)
    this.buildGrandHighway();

    // 2. Highway Overhead Gantry Signs & Streetlights
    this.buildHighwayInfrastructure();

    // 3. Modern City Road Network & Intersections
    this.buildCityRoadsAndIntersections();

    // 4. Modern Residential Homes (Contemporary Villas)
    this.buildModernHomes();

    // 5. Commercial Buildings & IT Offices
    this.buildCommercialBuildings();

    // 6. Street-level Retail Shops & Café Promenade
    this.buildShopsAndCafes();

    // 7. Urban Street Furniture & Small Details (Bus shelter, ATM, Fire hydrants, Bins, Billboard)
    this.buildUrbanDetails();

    // 8. Manicured Urban Trees & Landscaping
    this.buildUrbanLandscaping();
  }

  /**
   * 1. Multi-Lane Divided National Highway
   * Curves naturally from Rural Junction (X: 30, Z: 56) to City Gateway (X: 200, Z: 36)
   * Road width: 14 meters (2 outbound lanes, 2 inbound lanes + shoulders)
   */
  private buildGrandHighway(): void {
    const hwGroup = new THREE.Group();
    hwGroup.name = 'national_highway_roadbed';

    // Highway centerline curve
    const hwCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(30, 0.045, 56),  // Rural connection
      new THREE.Vector3(75, 0.045, 56),  // Straight countryside corridor
      new THREE.Vector3(120, 0.045, 54), // Gentle sweeping curve
      new THREE.Vector3(160, 0.045, 48), // Approach to city entrance
      new THREE.Vector3(188, 0.045, 36), // City gateway bend
      new THREE.Vector3(204, 0.045, 18), // Transition into City Grand Avenue
      new THREE.Vector3(208, 0.045, -5), // North city junction
    ]);

    const numSegments = 60;
    const hwPoints = hwCurve.getPoints(numSegments);
    const hwWidth = 14.0; // 4 lanes total

    // Extrude highway asphalt ribbon
    const hwGeo = new THREE.BufferGeometry();
    const hwVerts: number[] = [];
    const hwIndices: number[] = [];

    // Embankment shoulder geometry
    const embGeo = new THREE.BufferGeometry();
    const embVerts: number[] = [];
    const embIndices: number[] = [];

    for (let i = 0; i < hwPoints.length; i++) {
      const pt = hwPoints[i];
      let tangent = new THREE.Vector3(1, 0, 0);
      if (i < hwPoints.length - 1) {
        tangent = hwPoints[i + 1].clone().sub(pt).normalize();
      } else if (i > 0) {
        tangent = pt.clone().sub(hwPoints[i - 1]).normalize();
      }
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Asphalt roadway surface
      hwVerts.push(
        pt.x + normal.x * hwWidth * 0.5, 0.05, pt.z + normal.z * hwWidth * 0.5,
        pt.x - normal.x * hwWidth * 0.5, 0.05, pt.z - normal.z * hwWidth * 0.5
      );

      // Sloped earthen/gravel highway embankment on both sides
      const embWidth = 2.4;
      embVerts.push(
        pt.x + normal.x * (hwWidth * 0.5 + embWidth), -0.02, pt.z + normal.z * (hwWidth * 0.5 + embWidth),
        pt.x + normal.x * hwWidth * 0.5, 0.045, pt.z + normal.z * hwWidth * 0.5,
        pt.x - normal.x * hwWidth * 0.5, 0.045, pt.z - normal.z * hwWidth * 0.5,
        pt.x - normal.x * (hwWidth * 0.5 + embWidth), -0.02, pt.z - normal.z * (hwWidth * 0.5 + embWidth)
      );

      if (i < hwPoints.length - 1) {
        const base = i * 2;
        hwIndices.push(base, base + 1, base + 2);
        hwIndices.push(base + 1, base + 3, base + 2);

        const eBase = i * 4;
        // Left embankment slope
        embIndices.push(eBase, eBase + 1, eBase + 4);
        embIndices.push(eBase + 1, eBase + 5, eBase + 4);
        // Right embankment slope
        embIndices.push(eBase + 2, eBase + 3, eBase + 6);
        embIndices.push(eBase + 3, eBase + 7, eBase + 6);
      }
    }

    hwGeo.setAttribute('position', new THREE.Float32BufferAttribute(hwVerts, 3));
    hwGeo.setIndex(hwIndices);
    hwGeo.computeVertexNormals();

    const hwMesh = new THREE.Mesh(hwGeo, this.matAsphalt);
    hwMesh.receiveShadow = true;
    hwGroup.add(hwMesh);

    embGeo.setAttribute('position', new THREE.Float32BufferAttribute(embVerts, 3));
    embGeo.setIndex(embIndices);
    embGeo.computeVertexNormals();

    const embMesh = new THREE.Mesh(embGeo, this.matEmbankmentGravel);
    embMesh.receiveShadow = true;
    hwGroup.add(embMesh);

    // ROAD MARKINGS: Double solid yellow center median
    for (let i = 0; i < hwPoints.length - 1; i++) {
      const p1 = hwPoints[i];
      const p2 = hwPoints[i + 1];
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const dist = p1.distanceTo(p2);

      let tangent = p2.clone().sub(p1).normalize();
      let normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      [-0.18, 0.18].forEach(offset => {
        const stripe = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.015, dist),
          this.matAsphaltMarkingYellow
        );
        stripe.position.set(mid.x + normal.x * offset, 0.06, mid.z + normal.z * offset);
        stripe.lookAt(p2.x + normal.x * offset, 0.06, p2.z + normal.z * offset);
        hwGroup.add(stripe);
      });
    }

    // ROAD MARKINGS: Dashed white lane dividers (1 lane divider on each side = 4 lanes total)
    for (let i = 0; i < hwPoints.length - 1; i += 2) {
      const p1 = hwPoints[i];
      const p2 = hwPoints[i + 1];
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const dist = p1.distanceTo(p2);

      let tangent = p2.clone().sub(p1).normalize();
      let normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Outer lane dividers at +/- 3.4 meters from centerline
      [-3.4, 3.4].forEach(offset => {
        const dash = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.015, dist * 0.65),
          this.matAsphaltMarkingWhite
        );
        dash.position.set(mid.x + normal.x * offset, 0.06, mid.z + normal.z * offset);
        dash.lookAt(p2.x + normal.x * offset, 0.06, p2.z + normal.z * offset);
        hwGroup.add(dash);
      });
    }

    // ROAD MARKINGS: Solid white outer shoulder edge lines
    for (let i = 0; i < hwPoints.length - 1; i++) {
      const p1 = hwPoints[i];
      const p2 = hwPoints[i + 1];
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const dist = p1.distanceTo(p2);

      let tangent = p2.clone().sub(p1).normalize();
      let normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      [-6.5, 6.5].forEach(offset => {
        const edgeLine = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.015, dist),
          this.matAsphaltMarkingWhite
        );
        edgeLine.position.set(mid.x + normal.x * offset, 0.06, mid.z + normal.z * offset);
        edgeLine.lookAt(p2.x + normal.x * offset, 0.06, p2.z + normal.z * offset);
        hwGroup.add(edgeLine);
      });
    }

    // CONCRETE NEW JERSEY SAFETY BARRIERS along outer curve of highway
    for (let i = 4; i < hwPoints.length - 8; i += 3) {
      const pt = hwPoints[i];
      const nextPt = hwPoints[i + 1] || pt;
      const tangent = nextPt.clone().sub(pt).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Place along the southern/outer shoulder of the highway curve
      const barrierPos = pt.clone().add(normal.clone().multiplyScalar(7.2));
      const barrier = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.85, 4.2),
        this.matJerseyBarrier
      );
      barrier.position.set(barrierPos.x, 0.45, barrierPos.z);
      barrier.lookAt(barrierPos.x + tangent.x, 0.45, barrierPos.z + tangent.z);
      barrier.castShadow = true;
      barrier.receiveShadow = true;
      hwGroup.add(barrier);

      // Collider to prevent player falling off road embankment
      this.collisionSystem.addCollider({
        id: `hw_barrier_${i}`,
        type: 'box',
        position: new THREE.Vector3(barrierPos.x, 0.45, barrierPos.z),
        size: new THREE.Vector3(0.55, 0.9, 4.2),
        rotationY: barrier.rotation.y,
      });
    }

    // WALKABLE PEDESTRIAN SIDEWALK connecting village road to city
    const swCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(30, 0.12, 63.5),
      new THREE.Vector3(75, 0.12, 63.5),
      new THREE.Vector3(120, 0.12, 61.5),
      new THREE.Vector3(160, 0.12, 55.5),
      new THREE.Vector3(188, 0.12, 43.5),
      new THREE.Vector3(200, 0.12, 25.5),
      new THREE.Vector3(202, 0.12, 5.0),
    ]);
    const swPoints = swCurve.getPoints(40);
    const swGeo = new THREE.BufferGeometry();
    const swVerts: number[] = [];
    const swIndices: number[] = [];
    const swWidth = 2.8;

    for (let i = 0; i < swPoints.length; i++) {
      const pt = swPoints[i];
      let tangent = new THREE.Vector3(1, 0, 0);
      if (i < swPoints.length - 1) {
        tangent = swPoints[i + 1].clone().sub(pt).normalize();
      } else if (i > 0) {
        tangent = pt.clone().sub(swPoints[i - 1]).normalize();
      }
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      swVerts.push(
        pt.x + normal.x * swWidth * 0.5, 0.12, pt.z + normal.z * swWidth * 0.5,
        pt.x - normal.x * swWidth * 0.5, 0.12, pt.z - normal.z * swWidth * 0.5
      );

      if (i < swPoints.length - 1) {
        const base = i * 2;
        swIndices.push(base, base + 1, base + 2);
        swIndices.push(base + 1, base + 3, base + 2);
      }
    }

    swGeo.setAttribute('position', new THREE.Float32BufferAttribute(swVerts, 3));
    swGeo.setIndex(swIndices);
    swGeo.computeVertexNormals();

    const swMesh = new THREE.Mesh(swGeo, this.matSidewalkTile);
    swMesh.receiveShadow = true;
    hwGroup.add(swMesh);

    this.group.add(hwGroup);
  }

  /**
   * 2. Highway Infrastructure: Overhead Gantry, Roadside Warning Signs, Streetlights
   */
  private buildHighwayInfrastructure(): void {
    const infraGroup = new THREE.Group();
    infraGroup.name = 'highway_infrastructure';

    // A. GRAND OVERHEAD HIGHWAY GANTRY TRUSS SIGN (at X: 110, Z: 55)
    const gantry = new THREE.Group();
    gantry.position.set(110, 0, 55);

    // Vertical steel truss pillars on both sides of highway
    [-7.8, 7.8].forEach(pz => {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.3, 7.2, 8),
        this.matMetalFrame
      );
      pillar.position.set(0, 3.6, pz);
      pillar.castShadow = true;
      gantry.add(pillar);

      this.collisionSystem.addCollider({
        id: `gantry_pillar_${pz}`,
        type: 'sphere',
        position: new THREE.Vector3(110, 0, 55 + pz),
        radius: 0.5,
      });
    });

    // Horizontal overhead truss crossbeam
    const crossbeam = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.8, 16.0),
      this.matMetalFrame
    );
    crossbeam.position.set(0, 6.8, 0);
    gantry.add(crossbeam);

    // Overhead Destination Signboards (Authentic Green Highway Panels)
    const matGantryGreen = new THREE.MeshLambertMaterial({ color: '#15803d' });

    // Sign 1: Eastbound to Metropolis
    const sign1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 5.8), matGantryGreen);
    sign1.position.set(-0.35, 6.8, 3.2);
    gantry.add(sign1);

    // Sign 1 White border & Text representation
    const border1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.65, 5.65), this.matAsphaltMarkingWhite);
    border1.position.set(-0.34, 6.8, 3.2);
    gantry.add(border1);

    const inner1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.5, 5.5), matGantryGreen);
    inner1.position.set(-0.33, 6.8, 3.2);
    gantry.add(inner1);

    // Sign 2: Westbound to Rangastalam Village
    const sign2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 5.8), matGantryGreen);
    sign2.position.set(0.35, 6.8, -3.2);
    gantry.add(sign2);

    const border2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.65, 5.65), this.matAsphaltMarkingWhite);
    border2.position.set(0.34, 6.8, -3.2);
    gantry.add(border2);

    const inner2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.5, 5.5), matGantryGreen);
    inner2.position.set(0.33, 6.8, -3.2);
    gantry.add(inner2);

    infraGroup.add(gantry);

    // B. HIGHWAY LED STREETLIGHT POLES (Tubular arched high-mast lights)
    const poleLocations = [
      { x: 45, z: 63.8 },
      { x: 75, z: 63.8 },
      { x: 105, z: 63.8 },
      { x: 135, z: 61.8 },
      { x: 165, z: 56.5 },
      { x: 192, z: 44.5 },
    ];

    poleLocations.forEach((loc, idx) => {
      const poleGroup = new THREE.Group();
      poleGroup.position.set(loc.x, 0, loc.z);

      // Main vertical pole
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.22, 8.5, 8),
        this.matMetalFrame
      );
      mast.position.y = 4.25;
      mast.castShadow = true;
      poleGroup.add(mast);

      // Arched arm curving over road
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 3.2, 8),
        this.matMetalFrame
      );
      arm.rotation.x = -Math.PI / 3;
      arm.position.set(0, 8.2, -1.2);
      poleGroup.add(arm);

      // LED luminaire fixture
      const fixture = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.15, 0.9),
        this.matGlowLamp
      );
      fixture.position.set(0, 8.8, -2.4);
      poleGroup.add(fixture);

      // Downward streetlight
      const light = new THREE.PointLight('#fef08a', 1.8, 26);
      light.position.set(0, 8.4, -2.4);
      poleGroup.add(light);
      this.streetLights.push(light);

      infraGroup.add(poleGroup);

      this.collisionSystem.addCollider({
        id: `hw_pole_${idx}`,
        type: 'sphere',
        position: new THREE.Vector3(loc.x, 0, loc.z),
        radius: 0.45,
      });
    });

    // C. SPEED LIMIT & HIGHWAY SIGNPOSTS
    const signPosts = [
      { x: 60, z: 63.5, type: 'speed_60' },
      { x: 145, z: 60.5, type: 'curve_ahead' },
      { x: 178, z: 49.0, type: 'city_welcome' },
    ];

    signPosts.forEach((sp, idx) => {
      const postGroup = new THREE.Group();
      postGroup.position.set(sp.x, 0, sp.z);

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6), this.matMetalFrame);
      post.position.y = 1.3;
      postGroup.add(post);

      if (sp.type === 'speed_60') {
        const board = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 16), this.matAsphaltMarkingWhite);
        board.rotation.x = Math.PI / 2;
        board.position.y = 2.4;
        postGroup.add(board);

        const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.53, 16), this.matTrafficRed);
        ring.position.set(0, 2.4, -0.03);
        ring.rotation.y = Math.PI;
        postGroup.add(ring);
      } else if (sp.type === 'curve_ahead') {
        const board = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.05), this.matAsphaltMarkingYellow);
        board.rotation.z = Math.PI / 4;
        board.position.y = 2.4;
        postGroup.add(board);
      } else if (sp.type === 'city_welcome') {
        const board = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.06), new THREE.MeshLambertMaterial({ color: '#0284c7' }));
        board.position.y = 2.4;
        postGroup.add(board);
      }

      infraGroup.add(postGroup);
    });

    this.group.add(infraGroup);
  }

  /**
   * 3. Modern City Road Network & 4-Way Urban Intersection
   * City Grand Boulevard (N-S) from Z: 20 down to Z: -130
   * City Cross Street (E-W) from X: 160 to X: 270 at Z: -45
   */
  private buildCityRoadsAndIntersections(): void {
    const roadGroup = new THREE.Group();
    roadGroup.name = 'city_road_network';

    // A. City Grand Avenue (North-South corridor, X: 210, width 13.5m, Z from 20 to -130)
    const aveLen = 150;
    const aveGeo = new THREE.PlaneGeometry(13.5, aveLen);
    aveGeo.rotateX(-Math.PI / 2);
    const aveMesh = new THREE.Mesh(aveGeo, this.matAsphalt);
    aveMesh.position.set(210, 0.05, -55);
    aveMesh.receiveShadow = true;
    roadGroup.add(aveMesh);

    // Avenue Centerline double yellow stripes
    [-0.18, 0.18].forEach(off => {
      const yellowLine = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.015, aveLen),
        this.matAsphaltMarkingYellow
      );
      yellowLine.position.set(210 + off, 0.06, -55);
      roadGroup.add(yellowLine);
    });

    // Dashed white lane dividers on both sides
    for (let z = 15; z > -125; z -= 5) {
      // Don't draw across the intersection zone (Z: -53 to -37)
      if (z < -35 && z > -55) continue;

      [-3.3, 3.3].forEach(off => {
        const dash = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.015, 3.0),
          this.matAsphaltMarkingWhite
        );
        dash.position.set(210 + off, 0.06, z);
        roadGroup.add(dash);
      });
    }

    // B. City Cross Street (East-West corridor at Z: -45, width 12m, X from 165 to 265)
    const crossLen = 100;
    const crossGeo = new THREE.PlaneGeometry(crossLen, 12.0);
    crossGeo.rotateX(-Math.PI / 2);
    const crossMesh = new THREE.Mesh(crossGeo, this.matAsphalt);
    crossMesh.position.set(215, 0.052, -45);
    crossMesh.receiveShadow = true;
    roadGroup.add(crossMesh);

    // Cross Street centerline yellow stripes
    [-0.18, 0.18].forEach(off => {
      const yellowLine = new THREE.Mesh(
        new THREE.BoxGeometry(crossLen, 0.015, 0.14),
        this.matAsphaltMarkingYellow
      );
      yellowLine.position.set(215, 0.06, -45 + off);
      roadGroup.add(yellowLine);
    });

    // C. 4-WAY INTERSECTION ZEBRA CROSSINGS (White reflective stripes)
    const crosswalkConfigs = [
      // South crosswalk on Avenue (Z: -36)
      { x: 210, z: -36, rot: 0, width: 12.0 },
      // North crosswalk on Avenue (Z: -54)
      { x: 210, z: -54, rot: 0, width: 12.0 },
      // West crosswalk on Cross Street (X: 201)
      { x: 201, z: -45, rot: Math.PI / 2, width: 11.0 },
      // East crosswalk on Cross Street (X: 219)
      { x: 219, z: -45, rot: Math.PI / 2, width: 11.0 },
    ];

    crosswalkConfigs.forEach(cw => {
      const numStripes = 8;
      for (let s = 0; s < numStripes; s++) {
        const stripe = new THREE.Mesh(
          new THREE.BoxGeometry(cw.rot === 0 ? 0.6 : 3.6, 0.016, cw.rot === 0 ? 3.6 : 0.6),
          this.matAsphaltMarkingWhite
        );
        const offset = (s - numStripes / 2 + 0.5) * 1.3;
        if (cw.rot === 0) {
          stripe.position.set(cw.x + offset, 0.062, cw.z);
        } else {
          stripe.position.set(cw.x, 0.062, cw.z + offset);
        }
        roadGroup.add(stripe);
      }
    });

    // D. ELEVATED SIDEWALKS with black/yellow striped curbstones
    const sidewalkBlocks = [
      // West Sidewalk along Avenue (North of cross street: X: 198 to 203, Z: -55 to -130)
      { x: 200, z: -92, w: 6.0, d: 74 },
      // West Sidewalk along Avenue (South of cross street: X: 198 to 203, Z: 15 to -35)
      { x: 200, z: -10, w: 6.0, d: 50 },
      // East Sidewalk along Avenue (North of cross street: X: 217 to 223, Z: -55 to -130)
      { x: 220, z: -92, w: 6.0, d: 74 },
      // East Sidewalk along Avenue (South of cross street: X: 217 to 223, Z: 15 to -35)
      { x: 220, z: -10, w: 6.0, d: 50 },
      // Plaza Pavement (Center-East pedestrian promenade: X: 220 to 255, Z: -15 to 25)
      { x: 238, z: 5, w: 40.0, d: 40.0 },
    ];

    sidewalkBlocks.forEach(sb => {
      const sw = new THREE.Mesh(
        new THREE.BoxGeometry(sb.w, 0.16, sb.d),
        this.matSidewalkTile
      );
      sw.position.set(sb.x, 0.12, sb.z);
      sw.receiveShadow = true;
      roadGroup.add(sw);
    });

    // E. 4-WAY INTERSECTION TRAFFIC LIGHT GANTRIES
    const trafficLightLocs = [
      { x: 202, z: -37, rotY: 0 },
      { x: 218, z: -53, rotY: Math.PI },
      { x: 202, z: -53, rotY: Math.PI / 2 },
      { x: 218, z: -37, rotY: -Math.PI / 2 },
    ];

    trafficLightLocs.forEach(tl => {
      const tlGroup = new THREE.Group();
      tlGroup.position.set(tl.x, 0, tl.z);
      tlGroup.rotation.y = tl.rotY;

      // Vertical post
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 5.6, 8), this.matMetalFrame);
      post.position.y = 2.8;
      tlGroup.add(post);

      // Signal housing box
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.4, 0.35), this.matMetalFrame);
      box.position.set(0, 4.8, 0.2);
      tlGroup.add(box);

      // 3 Signal Lenses (Red, Amber, Green)
      const red = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), this.matTrafficRed);
      red.position.set(0, 5.2, 0.38);
      tlGroup.add(red);

      const amber = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), this.matTrafficAmber);
      amber.position.set(0, 4.8, 0.38);
      tlGroup.add(amber);

      const green = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), this.matTrafficGreen);
      green.position.set(0, 4.4, 0.38);
      tlGroup.add(green);

      roadGroup.add(tlGroup);
    });

    this.group.add(roadGroup);
  }

  /**
   * 4. Modern Residential Homes (Contemporary Villas)
   * High-end modern villas with flat roofs, timber louvers, glass balconies, carports, and solar panels.
   */
  private buildModernHomes(): void {
    const homesGroup = new THREE.Group();
    homesGroup.name = 'modern_residential_villas';

    const villaConfigs = [
      // Villa 1 (North-East Residential Sector: X: 245, Z: -85)
      { x: 245, z: -85, wallMat: this.matVillaWallWhite, accentMat: this.matTimberAccent },
      // Villa 2 (North-East Residential Sector: X: 245, Z: -120)
      { x: 245, z: -120, wallMat: this.matVillaWallCharcoal, accentMat: this.matVillaWallWhite },
    ];

    villaConfigs.forEach((cfg, idx) => {
      const villa = new THREE.Group();
      villa.position.set(cfg.x, 0, cfg.z);

      // Ground Floor Main Body (14m wide x 4.2m high x 12m deep)
      const groundFloor = new THREE.Mesh(
        new THREE.BoxGeometry(14, 4.2, 12),
        cfg.wallMat
      );
      groundFloor.position.y = 2.1;
      groundFloor.castShadow = true;
      groundFloor.receiveShadow = true;
      villa.add(groundFloor);

      // First Floor Cantilevered Body (12m x 3.8m x 10m)
      const firstFloor = new THREE.Mesh(
        new THREE.BoxGeometry(12, 3.8, 10),
        cfg.accentMat
      );
      firstFloor.position.set(-1, 4.2 + 1.9, 0);
      firstFloor.castShadow = true;
      firstFloor.receiveShadow = true;
      villa.add(firstFloor);

      // Floor-to-ceiling glass picture windows on Ground Floor
      const winGeo = new THREE.BoxGeometry(4.2, 2.6, 0.1);
      const win1 = new THREE.Mesh(winGeo, this.matBuildingOfficeGlass);
      win1.position.set(0, 2.0, -6.05);
      villa.add(win1);

      // Balcony with tinted glass balustrade on First Floor
      const balFloor = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 3), this.matConcreteCurbs);
      balFloor.position.set(2, 4.05, -5.5);
      villa.add(balFloor);

      const balRailing = new THREE.Mesh(new THREE.BoxGeometry(6, 1.0, 0.08), this.matGlassPanel);
      balRailing.position.set(2, 4.7, -6.9);
      villa.add(balRailing);

      // Modern Carport Pergola
      const carportRoof = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 5.5), this.matMetalFrame);
      carportRoof.position.set(6.5, 3.2, 2.5);
      villa.add(carportRoof);

      // Carport Steel Pillars
      [4.0, 9.0].forEach(cx => {
        const cPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 6), this.matMetalFrame);
        cPillar.position.set(cx, 1.6, 5.0);
        villa.add(cPillar);
      });

      // Rooftop Solar Panel Arrays
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 3; c++) {
          const panel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 1.4), this.matSolarPanel);
          panel.position.set(-3.5 + c * 2.5, 8.1, -2.0 + r * 2.0);
          panel.rotation.x = -Math.PI / 10;
          villa.add(panel);
        }
      }

      // Compound Boundary Wall with modern horizontal slats
      const wallMat = this.matConcreteCurbs;
      const frontWall1 = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.6, 0.25), wallMat);
      frontWall1.position.set(-4.5, 0.8, -8.5);
      villa.add(frontWall1);

      const frontWall2 = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.6, 0.25), wallMat);
      frontWall2.position.set(5.5, 0.8, -8.5);
      villa.add(frontWall2);

      // Villa Entrance Gate (Stainless steel finish)
      const gate = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.4, 0.08), this.matGuardrailSteel);
      gate.position.set(0.5, 0.7, -8.5);
      villa.add(gate);

      // Villa Garden Lawn
      const lawn = new THREE.Mesh(new THREE.BoxGeometry(16, 0.04, 18), this.matLawnGrass);
      lawn.position.set(0, 0.02, -1);
      lawn.receiveShadow = true;
      villa.add(lawn);

      homesGroup.add(villa);

      // Colliders for Villa Structures
      this.collisionSystem.addCollider({
        id: `villa_body_${idx}`,
        type: 'box',
        position: new THREE.Vector3(cfg.x, 2.1, cfg.z),
        size: new THREE.Vector3(14.5, 8.0, 12.5),
      });

      this.collisionSystem.addCollider({
        id: `villa_wall_${idx}`,
        type: 'box',
        position: new THREE.Vector3(cfg.x, 0.8, cfg.z - 8.5),
        size: new THREE.Vector3(16.0, 1.6, 0.5),
      });
    });

    this.group.add(homesGroup);
  }

  /**
   * 5. Commercial Buildings & High-Tech IT Offices
   * Multi-story glass curtain wall corporate towers and civic center
   */
  private buildCommercialBuildings(): void {
    const commGroup = new THREE.Group();
    commGroup.name = 'commercial_office_towers';

    // A. 5-Story Glass IT Tech Hub (X: 250, Z: -45)
    const itTower = new THREE.Group();
    itTower.position.set(250, 0, -45);

    const itBody = new THREE.Mesh(new THREE.BoxGeometry(22, 24, 18), this.matBuildingOfficeGlass);
    itBody.position.y = 12;
    itBody.castShadow = true;
    itTower.add(itBody);

    // Floor divider concrete slabs
    for (let f = 1; f < 5; f++) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(22.4, 0.6, 18.4), this.matBuildingConcrete);
      slab.position.y = f * 4.8;
      itTower.add(slab);
    }

    // Rooftop Communications Tower & HVAC chillers
    const hvac = new THREE.Mesh(new THREE.BoxGeometry(6, 2.2, 4), this.matMetalFrame);
    hvac.position.set(0, 25.1, 0);
    itTower.add(hvac);

    const commSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.3, 7.5, 8), this.matGuardrailSteel);
    commSpire.position.set(4, 27.75, 2);
    itTower.add(commSpire);

    commGroup.add(itTower);

    this.collisionSystem.addCollider({
      id: 'it_tech_hub',
      type: 'box',
      position: new THREE.Vector3(250, 12, -45),
      size: new THREE.Vector3(22.8, 24.0, 18.8),
    });

    // B. City Civic Center & Town Hall with Clock Face (X: 250, Z: 5)
    const civicHall = new THREE.Group();
    civicHall.position.set(250, 0, 5);

    const civicBody = new THREE.Mesh(new THREE.BoxGeometry(24, 15, 20), this.matVillaWallWhite);
    civicBody.position.y = 7.5;
    civicBody.castShadow = true;
    civicHall.add(civicBody);

    // Portico Columns
    [-8, -4, 4, 8].forEach(px => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 12, 12), this.matConcreteCurbs);
      col.position.set(px, 6.0, -10.8);
      col.castShadow = true;
      civicHall.add(col);
    });

    // Portico Roof Pediment
    const pediment = new THREE.Mesh(new THREE.ConeGeometry(12, 3.5, 4), this.matBuildingConcrete);
    pediment.position.set(0, 13.75, -10.8);
    pediment.rotation.y = Math.PI / 4;
    civicHall.add(pediment);

    // Clock Spire
    const clockSpire = new THREE.Mesh(new THREE.BoxGeometry(5, 7, 5), this.matBuildingConcrete);
    clockSpire.position.set(0, 18.5, 0);
    civicHall.add(clockSpire);

    const clockDial = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.3, 16), this.matAsphaltMarkingWhite);
    clockDial.rotation.x = Math.PI / 2;
    clockDial.position.set(0, 19.0, -2.6);
    civicHall.add(clockDial);

    commGroup.add(civicHall);

    this.collisionSystem.addCollider({
      id: 'civic_town_hall',
      type: 'box',
      position: new THREE.Vector3(250, 7.5, 5),
      size: new THREE.Vector3(24.5, 15.0, 22.0),
    });

    // C. 3-Story Modern City Medical Center & Clinic (X: 175, Z: -85)
    const clinic = new THREE.Group();
    clinic.position.set(175, 0, -85);

    const clinicBody = new THREE.Mesh(new THREE.BoxGeometry(18, 12, 16), this.matVillaWallWhite);
    clinicBody.position.y = 6;
    clinicBody.castShadow = true;
    clinic.add(clinicBody);

    // Illuminated Medical Green Cross on Facade
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 0.7), this.matTrafficGreen);
    crossV.position.set(9.05, 7.5, 0);
    clinic.add(crossV);

    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 2.2), this.matTrafficGreen);
    crossH.position.set(9.05, 7.5, 0);
    clinic.add(crossH);

    commGroup.add(clinic);

    this.collisionSystem.addCollider({
      id: 'city_medical_clinic',
      type: 'box',
      position: new THREE.Vector3(175, 6, -85),
      size: new THREE.Vector3(18.5, 12.0, 16.5),
    });

    this.group.add(commGroup);
  }

  /**
   * 6. Street-level Retail Shops & Café Promenade
   * - "CityMart" Supermarket (X: 175, Z: -45)
   * - "Ayyagaru Nivasam" Sri Ayyagaru's House & Front Veranda (X: 171, Z: -15)
   * - "TechWorld Electronics" (X: 175, Z: 18)
   */
  private buildShopsAndCafes(): void {
    const shopsGroup = new THREE.Group();
    shopsGroup.name = 'commercial_shops_promenade';

    // A. "CityMart" Supermarket (X: 175, Z: -45)
    const mart = new THREE.Group();
    mart.position.set(175, 0, -45);

    const martBody = new THREE.Mesh(new THREE.BoxGeometry(18, 6.5, 16), this.matShopFacadeGreen);
    martBody.position.y = 3.25;
    martBody.castShadow = true;
    mart.add(martBody);

    // Mart Glass Entrance Windows
    const martGlass = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.5, 10), this.matBuildingOfficeGlass);
    martGlass.position.set(9.05, 2.0, 0);
    mart.add(martGlass);

    // Mart Illuminated Brand Signboard
    const martSign = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.4, 8.5), this.matGlowLamp);
    martSign.position.set(9.1, 5.2, 0);
    mart.add(martSign);

    // Shopping Carts Bay outside
    const cartBay = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.2, 3.5), this.matGuardrailSteel);
    cartBay.position.set(10.5, 0.6, -6.0);
    mart.add(cartBay);

    shopsGroup.add(mart);

    this.collisionSystem.addCollider({
      id: 'shop_citymart',
      type: 'box',
      position: new THREE.Vector3(175, 3.25, -45),
      size: new THREE.Vector3(18.5, 6.5, 16.5),
    });

    // B. "Ayyagaru Nivasam" - Sri Ayyagaru's Traditional House & Front Veranda (X: 171, Z: -15)
    // Vedic Priest's city residence with traditional architecture, open front veranda, and auspicious decor
    const ayyagaruHouse = new THREE.Group();
    ayyagaruHouse.position.set(171, 0, -15);

    // 1. House Main Structure (Warm ochre-sandstone walls)
    const matHouseWall = new THREE.MeshStandardMaterial({
      color: '#d4a373', // Warm traditional ochre-sandstone
      roughness: 0.8,
      metalness: 0.05,
    });
    const houseBody = new THREE.Mesh(new THREE.BoxGeometry(14, 5.5, 14), matHouseWall);
    houseBody.position.y = 2.75;
    houseBody.castShadow = true;
    houseBody.receiveShadow = true;
    ayyagaruHouse.add(houseBody);

    // 2. Traditional Sloping Terracotta Mangalore Tile Roof
    const matRoofTile = new THREE.MeshStandardMaterial({
      color: '#991b1b', // Sacred rich terracotta red
      roughness: 0.7,
      metalness: 0.05,
    });
    const roofBase = new THREE.Mesh(new THREE.BoxGeometry(14.8, 0.35, 14.8), this.matTimberAccent);
    roofBase.position.y = 5.65;
    ayyagaruHouse.add(roofBase);

    // Sloping Gabled Roof
    const roofGable = new THREE.Mesh(new THREE.ConeGeometry(10.5, 3.2, 4), matRoofTile);
    roofGable.position.set(0, 7.25, 0);
    roofGable.rotation.y = Math.PI / 4;
    roofGable.castShadow = true;
    ayyagaruHouse.add(roofGable);

    // Golden Kalash Finial on Apex of Roof
    const finial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.22, 0.8, 8),
      this.matBrassAccent
    );
    finial.position.set(0, 9.2, 0);
    ayyagaruHouse.add(finial);

    // 3. Carved Teak Entrance Doorway (Facing East towards the road)
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 3.2, 2.2),
      this.matTimberAccent
    );
    doorFrame.position.set(7.05, 1.6, 0);
    ayyagaruHouse.add(doorFrame);

    const doorPanels = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 2.9, 1.8),
      new THREE.MeshStandardMaterial({ color: '#582f0e', roughness: 0.6 })
    );
    doorPanels.position.set(7.1, 1.5, 0);
    ayyagaruHouse.add(doorPanels);

    // Auspicious Brass Door Handles & Rings
    [-0.35, 0.35].forEach(dz => {
      const handle = new THREE.Mesh(
        new THREE.TorusGeometry(0.09, 0.02, 8, 16),
        this.matBrassAccent
      );
      handle.position.set(7.22, 1.45, dz);
      handle.rotation.y = Math.PI / 2;
      ayyagaruHouse.add(handle);
    });

    // 4. Sacred Mango Leaf Toran (Garland) with Marigold Flowers over Entrance
    const matToranGreen = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.8 });
    const matMarigoldOrange = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.6 });

    const toranRope = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.06, 2.3),
      matToranGreen
    );
    toranRope.position.set(7.22, 3.1, 0);
    ayyagaruHouse.add(toranRope);

    for (let mz = -0.9; mz <= 0.9; mz += 0.3) {
      const marigold = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), matMarigoldOrange);
      marigold.position.set(7.25, 3.02, mz);
      ayyagaruHouse.add(marigold);

      const mangoLeaf = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 4), matToranGreen);
      mangoLeaf.position.set(7.25, 2.9, mz);
      mangoLeaf.rotation.x = Math.PI;
      ayyagaruHouse.add(mangoLeaf);
    }

    // Auspicious Brass Temple Bell (Ghanta) hanging in entrance
    const bellChain = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.45, 6),
      this.matBrassAccent
    );
    bellChain.position.set(7.35, 2.9, 0);
    ayyagaruHouse.add(bellChain);

    const bell = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.22, 12),
      this.matBrassAccent
    );
    bell.position.set(7.35, 2.65, 0);
    ayyagaruHouse.add(bell);

    // 5. Prominent Illuminated House Nameplate Banner (Telugu & English)
    const nameplateBacking = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.85, 4.4),
      new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.5 })
    );
    nameplateBacking.position.set(7.22, 3.8, 0);
    ayyagaruHouse.add(nameplateBacking);

    const nameplateFace = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.72, 4.2),
      new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.4 })
    );
    nameplateFace.position.set(7.32, 3.8, 0);
    ayyagaruHouse.add(nameplateFace);

    // Decorative brass trim around sign
    const nameplateTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.78, 4.3),
      this.matBrassAccent
    );
    nameplateTrim.position.set(7.28, 3.8, 0);
    ayyagaruHouse.add(nameplateTrim);

    // 6. FRONT VERANDA COURTYARD (THINNAI)
    // Raised stone plinth extending forward toward Grand Avenue road (Y: 0 to 0.20m)
    const matVerandaPlinth = new THREE.MeshStandardMaterial({
      color: '#ddbea9', // Natural terracotta sandstone plinth
      roughness: 0.75,
    });
    const verandaPlinth = new THREE.Mesh(
      new THREE.BoxGeometry(9.0, 0.20, 12.0),
      matVerandaPlinth
    );
    // Positioned along X so it starts right in front of the house and extends to the sidewalk
    // House front is at local X: 7.0 (world 178). Plinth center at local X: 11.5 (world 182.5).
    // Plinth spans from local X: 7.0 to 16.0 (world 178 to 187).
    verandaPlinth.position.set(11.5, 0.10, 0);
    verandaPlinth.receiveShadow = true;
    ayyagaruHouse.add(verandaPlinth);

    // Auspicious Kolam / Rangoli in center of courtyard floor
    const matRangoliWhite = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    const matRangoliRed = new THREE.MeshBasicMaterial({ color: '#dc2626' });

    const rangoliBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.6, 0.005, 24),
      matRangoliWhite
    );
    rangoliBase.position.set(11.5, 0.205, 0);
    ayyagaruHouse.add(rangoliBase);

    const rangoliInner = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 0.008, 8),
      matRangoliRed
    );
    rangoliInner.position.set(11.5, 0.208, 0);
    rangoliInner.rotation.y = Math.PI / 8;
    ayyagaruHouse.add(rangoliInner);

    // 7. Carved Wooden Veranda Pillars with Brass Rings (Open front - no walls!)
    const pillarPositions = [
      { x: 15.6, z: -5.4 }, // Front-Right
      { x: 15.6, z: 5.4 },  // Front-Left
      { x: 7.5, z: -5.4 },  // Back-Right
      { x: 7.5, z: 5.4 },   // Back-Left
    ];

    pillarPositions.forEach(pp => {
      // Brass base
      const pBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.22, 0.25, 12),
        this.matBrassAccent
      );
      pBase.position.set(pp.x, 0.32, pp.z);
      ayyagaruHouse.add(pBase);

      // Carved wooden shaft
      const pShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.13, 3.2, 12),
        this.matTimberAccent
      );
      pShaft.position.set(pp.x, 1.8, pp.z);
      pShaft.castShadow = true;
      ayyagaruHouse.add(pShaft);

      // Top capital
      const pCap = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.22, 0.36),
        this.matTimberAccent
      );
      pCap.position.set(pp.x, 3.45, pp.z);
      ayyagaruHouse.add(pCap);
    });

    // Veranda Open Wooden Eave Canopy (high up at Y: 3.6m so view is 100% open below)
    const verandaRoof = new THREE.Mesh(
      new THREE.BoxGeometry(9.2, 0.22, 12.2),
      matRoofTile
    );
    verandaRoof.position.set(11.6, 3.65, 0);
    verandaRoof.castShadow = true;
    ayyagaruHouse.add(verandaRoof);

    // 8. Sacred Tulasi Kota (Holy Basil Shrine) in courtyard front corner (X: 15.5, Z: 4.6)
    const tulasiGroup = new THREE.Group();
    tulasiGroup.position.set(15.5, 0.20, 4.6);

    // Square tiered shrine base
    const tBase1 = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.35, 0.75), matHouseWall);
    tBase1.position.y = 0.175;
    tulasiGroup.add(tBase1);

    const tBase2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.6), matHouseWall);
    tBase2.position.y = 0.55;
    tulasiGroup.add(tBase2);

    // Pot / Planter
    const tPot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.18, 0.3, 12),
      new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.8 })
    );
    tPot.position.y = 0.9;
    tulasiGroup.add(tPot);

    // Tulasi Sacred Foliage
    const matTulasiFoliage = new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.7 });
    const tulasiBush = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), matTulasiFoliage);
    tulasiBush.position.y = 1.15;
    tulasiBush.scale.set(1.0, 1.2, 1.0);
    tulasiGroup.add(tulasiBush);

    // Tiny Brass Diya on the Tulasi Kota
    const tDiya = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.05, 8), this.matBrassAccent);
    tDiya.position.set(0.25, 0.38, 0);
    tulasiGroup.add(tDiya);

    ayyagaruHouse.add(tulasiGroup);

    // 9. Brass Pooja Deepams (Traditional oil lamps) on the veranda plinth corners
    [-5.0, 5.0].forEach(pz => {
      const lampBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.18, 0.12, 12),
        this.matBrassAccent
      );
      lampBase.position.set(15.6, 0.26, pz);
      ayyagaruHouse.add(lampBase);

      const lampPillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8),
        this.matBrassAccent
      );
      lampPillar.position.set(15.6, 0.52, pz);
      ayyagaruHouse.add(lampPillar);

      const lampBowl = new THREE.Mesh(
        new THREE.ConeGeometry(0.14, 0.1, 12),
        this.matBrassAccent
      );
      lampBowl.position.set(15.6, 0.75, pz);
      lampBowl.rotation.x = Math.PI;
      ayyagaruHouse.add(lampBowl);

      // Warm glowing flame tip
      const flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 6, 6),
        new THREE.MeshBasicMaterial({ color: '#fbbf24' })
      );
      flame.position.set(15.6, 0.82, pz);
      ayyagaruHouse.add(flame);
    });

    // 10. Front Entrance Step down to the Sidewalk (local X: 16.0 = world 187)
    const frontStep = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.10, 4.0),
      matVerandaPlinth
    );
    frontStep.position.set(16.25, 0.05, 0);
    ayyagaruHouse.add(frontStep);

    shopsGroup.add(ayyagaruHouse);

    // Collision Box: strictly covering the house walls behind the veranda!
    // House body is at world (171, 2.75, -15) with size 14.5m along X.
    // Front edge of collider is at X = 171 + 7.25 = 178.25.
    // The veranda is at world X: 178.5 to 187.0.
    // Ayyagaru sits at world X: 184.5.
    // Therefore, the veranda and Ayyagaru are completely unblocked by colliders!
    this.collisionSystem.addCollider({
      id: 'house_ayyagaru_residence',
      type: 'box',
      position: new THREE.Vector3(171, 2.75, -15),
      size: new THREE.Vector3(14.5, 5.5, 14.5),
    });

    // C. "TechWorld Electronics" Retail Store (X: 175, Z: 18)
    const tech = new THREE.Group();
    tech.position.set(175, 0, 18);

    const techBody = new THREE.Mesh(new THREE.BoxGeometry(16, 5.5, 14), this.matShopFacadeBlue);
    techBody.position.y = 2.75;
    techBody.castShadow = true;
    tech.add(techBody);

    const techGlass = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.2, 8.0), this.matBuildingOfficeGlass);
    techGlass.position.set(8.05, 1.9, 0);
    tech.add(techGlass);

    shopsGroup.add(tech);

    this.collisionSystem.addCollider({
      id: 'shop_techworld',
      type: 'box',
      position: new THREE.Vector3(175, 2.75, 18),
      size: new THREE.Vector3(16.5, 5.5, 14.5),
    });

    this.group.add(shopsGroup);
  }

  /**
   * 7. Small Urban Details: Bus Shelter, ATM Kiosk, Fire Hydrants, Trash Bins, Billboard, Streetlights
   */
  private buildUrbanDetails(): void {
    const detailsGroup = new THREE.Group();
    detailsGroup.name = 'urban_infrastructure_details';

    // A. MODERN GLASS BUS STOP SHELTER (at X: 201.5, Z: -22)
    const busShelter = new THREE.Group();
    busShelter.position.set(201.5, 0, -22);

    // Steel frame pillars
    [-2.2, 2.2].forEach(pz => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.8, 8), this.matMetalFrame);
      pillar.position.set(0, 1.4, pz);
      busShelter.add(pillar);
    });

    // Cantilever curved glass roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 5.0), this.matMetalFrame);
    roof.position.set(0.6, 2.8, 0);
    busShelter.add(roof);

    // Glass back panel
    const backGlass = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.4, 4.4), this.matGlassPanel);
    backGlass.position.set(0, 1.3, 0);
    busShelter.add(backGlass);

    // Transit Route Map Poster Panel
    const poster = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.6, 1.2), this.matAsphaltMarkingWhite);
    poster.position.set(0, 1.3, 1.6);
    busShelter.add(poster);

    // Wooden Waiting Bench
    const bench = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 2.8), this.matTimberAccent);
    bench.position.set(0.5, 0.55, -0.6);
    busShelter.add(bench);

    detailsGroup.add(busShelter);

    this.collisionSystem.addCollider({
      id: 'city_bus_shelter',
      type: 'box',
      position: new THREE.Vector3(201.5, 1.4, -22),
      size: new THREE.Vector3(2.4, 2.8, 5.0),
    });

    // B. WALK-UP 24/7 ATM BANKING KIOSK (at X: 201.5, Z: -62)
    const atmKiosk = new THREE.Group();
    atmKiosk.position.set(201.5, 0, -62);

    const atmBooth = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.8, 2.0), this.matVillaWallWhite);
    atmBooth.position.y = 1.4;
    atmKiosk.add(atmBooth);

    // Glowing green screen & canopy
    const atmScreen = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.9), this.matTrafficGreen);
    atmScreen.position.set(1.02, 1.5, 0);
    atmKiosk.add(atmScreen);

    detailsGroup.add(atmKiosk);

    this.collisionSystem.addCollider({
      id: 'city_atm_kiosk',
      type: 'box',
      position: new THREE.Vector3(201.5, 1.4, -62),
      size: new THREE.Vector3(2.2, 2.8, 2.2),
    });

    // C. TALL HIGHWAY ADVERTISING BILLBOARD (at X: 195, Z: 28)
    const billboard = new THREE.Group();
    billboard.position.set(195, 0, 28);

    const bbMast = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 11, 8), this.matMetalFrame);
    bbMast.position.y = 5.5;
    bbMast.castShadow = true;
    billboard.add(bbMast);

    const bbPanel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.5, 9.0), this.matBuildingOfficeGlass);
    bbPanel.position.set(0, 11.5, 0);
    billboard.add(bbPanel);

    detailsGroup.add(billboard);

    this.collisionSystem.addCollider({
      id: 'city_billboard_pole',
      type: 'sphere',
      position: new THREE.Vector3(195, 0, 28),
      radius: 0.6,
    });

    // D. RED FIRE HYDRANTS at sidewalk corners
    const hydrantLocs = [
      { x: 202.5, z: -38 },
      { x: 217.5, z: -52 },
    ];

    hydrantLocs.forEach(hl => {
      const hyd = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.75, 8), this.matTrafficRed);
      hyd.position.set(hl.x, 0.45, hl.z);
      detailsGroup.add(hyd);
    });

    // E. URBAN RECYCLING & TRASH BINS (Stainless steel duo bins)
    const binLocs = [
      { x: 202.5, z: -25 },
      { x: 217.5, z: -15 },
      { x: 202.5, z: -80 },
    ];

    binLocs.forEach(bl => {
      const binMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.8), this.matGuardrailSteel);
      binMesh.position.set(bl.x, 0.55, bl.z);
      detailsGroup.add(binMesh);
    });

    // F. CONTEMPORARY CITY LED STREETLIGHTS along Avenue sidewalks
    const cityStreetlightZ = [10, -15, -40, -65, -90, -115];
    cityStreetlightZ.forEach((sz, idx) => {
      [202.5, 217.5].forEach(sx => {
        const lightPole = new THREE.Group();
        lightPole.position.set(sx, 0, sz);

        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 6.2, 8), this.matMetalFrame);
        pole.position.y = 3.1;
        lightPole.add(pole);

        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 6), this.matMetalFrame);
        arm.rotation.z = sx < 210 ? -Math.PI / 4 : Math.PI / 4;
        arm.position.set(sx < 210 ? 0.6 : -0.6, 6.0, 0);
        lightPole.add(arm);

        const lum = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.6), this.matGlowLamp);
        lum.position.set(sx < 210 ? 1.2 : -1.2, 6.4, 0);
        lightPole.add(lum);

        const light = new THREE.PointLight('#fef08a', 1.6, 20);
        light.position.set(sx < 210 ? 1.2 : -1.2, 6.2, 0);
        lightPole.add(light);
        this.streetLights.push(light);

        detailsGroup.add(lightPole);

        this.collisionSystem.addCollider({
          id: `city_light_${idx}_${sx}`,
          type: 'sphere',
          position: new THREE.Vector3(sx, 0, sz),
          radius: 0.35,
        });
      });
    });

    this.group.add(detailsGroup);
  }

  /**
   * 8. Manicured Urban Trees & Sidewalk Pits
   * Ficus & Jacaranda trees planted inside cast-iron grates along avenues
   */
  private buildUrbanLandscaping(): void {
    const floraGroup = new THREE.Group();
    floraGroup.name = 'urban_landscaping';

    const treeLocations = [
      { x: 202.5, z: 0, type: 'ficus' },
      { x: 202.5, z: -30, type: 'jacaranda' },
      { x: 202.5, z: -70, type: 'ficus' },
      { x: 202.5, z: -105, type: 'jacaranda' },
      { x: 217.5, z: 0, type: 'jacaranda' },
      { x: 217.5, z: -30, type: 'ficus' },
      { x: 217.5, z: -70, type: 'jacaranda' },
      { x: 217.5, z: -105, type: 'ficus' },
    ];

    treeLocations.forEach((tl, idx) => {
      const tree = new THREE.Group();
      tree.position.set(tl.x, 0, tl.z);

      // Sidewalk Cast-Iron Tree Grate (Square frame)
      const grate = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 1.6), this.matMetalFrame);
      grate.position.y = 0.13;
      tree.add(grate);

      // Slender manicured trunk
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.24, 4.2, 8),
        this.matUrbanTreeTrunk
      );
      trunk.position.y = 2.1;
      trunk.castShadow = true;
      tree.add(trunk);

      // Spherical manicured canopy
      const folMat = tl.type === 'jacaranda' ? this.matJacarandaFoliage : this.matUrbanTreeFoliage;
      const canopy = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 8), folMat);
      canopy.position.y = 4.8;
      canopy.castShadow = true;
      tree.add(canopy);

      floraGroup.add(tree);

      this.collisionSystem.addCollider({
        id: `urban_tree_${idx}`,
        type: 'sphere',
        position: new THREE.Vector3(tl.x, 0, tl.z),
        radius: 0.35,
      });
    });

    // Manicured Box Hedges bordering sidewalks and commercial plots
    const hedgeConfigs = [
      { x: 200, z: -6, w: 0.8, d: 24 },
      { x: 200, z: -75, w: 0.8, d: 30 },
      { x: 220, z: -6, w: 0.8, d: 24 },
      { x: 220, z: -75, w: 0.8, d: 30 },
    ];

    hedgeConfigs.forEach(hc => {
      const hedge = new THREE.Mesh(new THREE.BoxGeometry(hc.w, 0.9, hc.d), this.matHedgeGreen);
      hedge.position.set(hc.x, 0.55, hc.z);
      hedge.castShadow = true;
      floraGroup.add(hedge);
    });

    this.group.add(floraGroup);
  }
}
