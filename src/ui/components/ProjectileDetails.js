import { PROJECTILES } from "../../config.js";

export function drawHTMLProjectileDetails(parentEl, type, color, scale = 1) {
  parentEl.innerHTML = "";
  parentEl.style.position = "relative";
  parentEl.style.display = "flex";
  parentEl.style.alignItems = "center";
  parentEl.style.justifyContent = "center";

  const spec = PROJECTILES[type];
  let w = spec ? spec.width : 32;
  let h = spec ? spec.height : 8;

  // Cap max preview width for visual harmony, maintaining aspect ratio
  if (w > 45) {
    const ratio = 45 / w;
    w = 45;
    h = h * ratio;
  }

  parentEl.style.width = `${w * scale}px`;
  parentEl.style.height = `${h * scale}px`;

  // Main body
  const body = document.createElement("div");
  body.style.position = "absolute";
  body.style.left = "0";
  body.style.top = "0";
  body.style.width = "100%";
  body.style.height = "100%";
  body.style.backgroundColor = type === "sivrisinek" ? "transparent" : color;
  body.style.borderRadius = `${(h / 2) * scale}px`;
  body.style.zIndex = "2";
  body.style.boxShadow = type === "sivrisinek" ? "none" : "0 1px 3px rgba(0,0,0,0.3)";
  parentEl.appendChild(body);

  // Wings / fins
  if (type === "mizrak") {
    const wingTop = document.createElement("div");
    wingTop.style.position = "absolute";
    wingTop.style.left = `${(w * 0.45) * scale}px`;
    wingTop.style.bottom = "100%";
    wingTop.style.width = `${6 * scale}px`;
    wingTop.style.height = `${10 * scale}px`;
    wingTop.style.backgroundColor = color;
    wingTop.style.borderRadius = "1px";
    wingTop.style.transformOrigin = "bottom left";
    wingTop.style.transform = "skewX(25deg)";
    wingTop.style.zIndex = "1";
    parentEl.appendChild(wingTop);

    const wingBottom = document.createElement("div");
    wingBottom.style.position = "absolute";
    wingBottom.style.left = `${(w * 0.45) * scale}px`;
    wingBottom.style.top = "100%";
    wingBottom.style.width = `${6 * scale}px`;
    wingBottom.style.height = `${10 * scale}px`;
    wingBottom.style.backgroundColor = color;
    wingBottom.style.borderRadius = "1px";
    wingBottom.style.transformOrigin = "top left";
    wingBottom.style.transform = "skewX(-25deg)";
    wingBottom.style.zIndex = "1";
    parentEl.appendChild(wingBottom);

    const fin1 = document.createElement("div");
    fin1.style.position = "absolute";
    fin1.style.left = `${(w * 0.05) * scale}px`;
    fin1.style.bottom = "100%";
    fin1.style.width = `${3 * scale}px`;
    fin1.style.height = `${5 * scale}px`;
    fin1.style.backgroundColor = color;
    parentEl.appendChild(fin1);

    const fin2 = document.createElement("div");
    fin2.style.position = "absolute";
    fin2.style.left = `${(w * 0.05) * scale}px`;
    fin2.style.top = "100%";
    fin2.style.width = `${3 * scale}px`;
    fin2.style.height = `${5 * scale}px`;
    fin2.style.backgroundColor = color;
    parentEl.appendChild(fin2);

    const nose = document.createElement("div");
    nose.style.position = "absolute";
    nose.style.right = "0";
    nose.style.top = "20%";
    nose.style.width = `${3.5 * scale}px`;
    nose.style.height = "60%";
    nose.style.backgroundColor = "rgb(255, 0, 0)";
    nose.style.borderRadius = "50%";
    nose.style.zIndex = "3";
    parentEl.appendChild(nose);
  }
  else if (type === "fettah" || type === "fettah_2" || type === "ebabil") {
    const tailFin = document.createElement("div");
    tailFin.style.position = "absolute";
    tailFin.style.left = `${2 * scale}px`;
    tailFin.style.top = `${(-4) * scale}px`;
    tailFin.style.width = `${3 * scale}px`;
    tailFin.style.height = `${(h + 8) * scale}px`;
    tailFin.style.backgroundColor = color;
    tailFin.style.zIndex = "1";
    parentEl.appendChild(tailFin);

    const nose = document.createElement("div");
    nose.style.position = "absolute";
    nose.style.right = "0";
    nose.style.top = "20%";
    nose.style.width = `${4 * scale}px`;
    nose.style.height = "60%";
    nose.style.backgroundColor = type === "fettah" ? "rgb(255, 200, 0)" : (type === "fettah_2" ? "rgb(255, 60, 60)" : "rgb(100, 110, 120)");
    nose.style.borderRadius = "50%";
    nose.style.zIndex = "3";
    parentEl.appendChild(nose);
  }
  else if (type === "sivrisinek") {
    const swarmOffsets = [
      { x: -2, y: -4 },
      { x: 5, y: 1 },
      { x: -5, y: 6 }
    ];

    swarmOffsets.forEach(offset => {
      const drone = document.createElement("div");
      drone.style.position = "absolute";
      drone.style.left = `${(w / 2 + offset.x - 5) * scale}px`;
      drone.style.top = `${(h / 2 + offset.y - 1) * scale}px`;
      drone.style.width = `${10 * scale}px`;
      drone.style.height = `${2 * scale}px`;
      drone.style.backgroundColor = color;
      drone.style.borderRadius = "0.5px";
      drone.style.zIndex = "2";

      const wWings = document.createElement("div");
      wWings.style.position = "absolute";
      wWings.style.left = `${4 * scale}px`;
      wWings.style.top = `${-3 * scale}px`;
      wWings.style.width = `${1.5 * scale}px`;
      wWings.style.height = `${8 * scale}px`;
      wWings.style.backgroundColor = color;
      wWings.style.borderRadius = "0.5px";
      wWings.style.zIndex = "1";
      drone.appendChild(wWings);

      const wNose = document.createElement("div");
      wNose.style.position = "absolute";
      wNose.style.right = "0";
      wNose.style.top = "0";
      wNose.style.width = `${1.2 * scale}px`;
      wNose.style.height = "100%";
      wNose.style.backgroundColor = "rgb(0, 255, 255)";
      wNose.style.borderRadius = "50%";
      wNose.style.zIndex = "3";
      drone.appendChild(wNose);

      parentEl.appendChild(drone);
    });
  }
  else if (type === "kemankes_2") {
    const wingTop = document.createElement("div");
    wingTop.style.position = "absolute";
    wingTop.style.left = `${(w * 0.42) * scale}px`;
    wingTop.style.bottom = "100%";
    wingTop.style.width = `${7 * scale}px`;
    wingTop.style.height = `${12 * scale}px`;
    wingTop.style.backgroundColor = color;
    wingTop.style.borderRadius = "2px";
    wingTop.style.transformOrigin = "bottom left";
    wingTop.style.transform = "skewX(35deg)";
    wingTop.style.zIndex = "1";
    parentEl.appendChild(wingTop);

    const wingBottom = document.createElement("div");
    wingBottom.style.position = "absolute";
    wingBottom.style.left = `${(w * 0.42) * scale}px`;
    wingBottom.style.top = "100%";
    wingBottom.style.width = `${7 * scale}px`;
    wingBottom.style.height = `${12 * scale}px`;
    wingBottom.style.backgroundColor = color;
    wingBottom.style.borderRadius = "2px";
    wingBottom.style.transformOrigin = "top left";
    wingBottom.style.transform = "skewX(-35deg)";
    wingBottom.style.zIndex = "1";
    parentEl.appendChild(wingBottom);

    const intakeTop = document.createElement("div");
    intakeTop.style.position = "absolute";
    intakeTop.style.left = `${(w * 0.25) * scale}px`;
    intakeTop.style.top = `${(-1.5) * scale}px`;
    intakeTop.style.width = `${5 * scale}px`;
    intakeTop.style.height = `${2 * scale}px`;
    intakeTop.style.backgroundColor = "rgb(50, 50, 55)";
    intakeTop.style.zIndex = "3";
    parentEl.appendChild(intakeTop);

    const intakeBottom = document.createElement("div");
    intakeBottom.style.position = "absolute";
    intakeBottom.style.left = `${(w * 0.25) * scale}px`;
    intakeBottom.style.bottom = `${(-1.5) * scale}px`;
    intakeBottom.style.width = `${5 * scale}px`;
    intakeBottom.style.height = `${2 * scale}px`;
    intakeBottom.style.backgroundColor = "rgb(50, 50, 55)";
    intakeBottom.style.zIndex = "3";
    parentEl.appendChild(intakeBottom);

    const finTop = document.createElement("div");
    finTop.style.position = "absolute";
    finTop.style.left = `${(w * 0.05) * scale}px`;
    finTop.style.bottom = "100%";
    finTop.style.width = `${3 * scale}px`;
    finTop.style.height = `${6 * scale}px`;
    finTop.style.backgroundColor = color;
    parentEl.appendChild(finTop);

    const finBottom = document.createElement("div");
    finBottom.style.position = "absolute";
    finBottom.style.left = `${(w * 0.05) * scale}px`;
    finBottom.style.top = "100%";
    finBottom.style.width = `${3 * scale}px`;
    finBottom.style.height = `${6 * scale}px`;
    finBottom.style.backgroundColor = color;
    parentEl.appendChild(finBottom);

    const nose = document.createElement("div");
    nose.style.position = "absolute";
    nose.style.right = "0";
    nose.style.top = "15%";
    nose.style.width = `${4 * scale}px`;
    nose.style.height = "70%";
    nose.style.backgroundColor = "rgb(255, 128, 0)";
    nose.style.borderRadius = "50%";
    nose.style.zIndex = "3";
    parentEl.appendChild(nose);
  }
  else if (type === "kemankes_1") {
    const wings = document.createElement("div");
    wings.style.position = "absolute";
    wings.style.left = `${(w * 0.4) * scale}px`;
    wings.style.top = `${(-6) * scale}px`;
    wings.style.width = `${4 * scale}px`;
    wings.style.height = `${(h + 12) * scale}px`;
    wings.style.backgroundColor = color;
    wings.style.borderRadius = "1px";
    wings.style.zIndex = "1";
    parentEl.appendChild(wings);

    const fins = document.createElement("div");
    fins.style.position = "absolute";
    fins.style.left = `${(w * 0.08) * scale}px`;
    fins.style.top = `${(-4) * scale}px`;
    fins.style.width = `${2 * scale}px`;
    fins.style.height = `${(h + 8) * scale}px`;
    fins.style.backgroundColor = color;
    fins.style.zIndex = "1";
    parentEl.appendChild(fins);

    const nose = document.createElement("div");
    nose.style.position = "absolute";
    nose.style.right = "0";
    nose.style.top = "20%";
    nose.style.width = `${3.5 * scale}px`;
    nose.style.height = "60%";
    nose.style.backgroundColor = "rgb(255, 255, 0)";
    nose.style.borderRadius = "50%";
    nose.style.zIndex = "3";
    parentEl.appendChild(nose);
  }
  else if (type === "kalkan_diha") {
    const wings = document.createElement("div");
    wings.style.position = "absolute";
    wings.style.left = `${(w * 0.45) * scale}px`;
    wings.style.top = `${(-16) * scale}px`;
    wings.style.width = `${5 * scale}px`;
    wings.style.height = `${(h + 32) * scale}px`;
    wings.style.backgroundColor = color;
    wings.style.borderRadius = "2px";
    wings.style.zIndex = "1";
    parentEl.appendChild(wings);

    const prop = document.createElement("div");
    prop.style.position = "absolute";
    prop.style.left = "0";
    prop.style.top = `${(-1) * scale}px`;
    prop.style.width = `${1.5 * scale}px`;
    prop.style.height = `${(h + 2) * scale}px`;
    prop.style.backgroundColor = "rgb(100, 100, 100)";
    prop.style.zIndex = "3";
    parentEl.appendChild(prop);

    const rotorOffsets = [
      { x: 0.45, y: -16 },
      { x: 0.45, y: 16 },
      { x: 0.2, y: -12 },
      { x: 0.2, y: 12 }
    ];
    rotorOffsets.forEach(ro => {
      const rot = document.createElement("div");
      rot.style.position = "absolute";
      rot.style.left = `${(w * ro.x) * scale}px`;
      rot.style.top = `${(h / 2 + ro.y - 1.5) * scale}px`;
      rot.style.width = `${3.5 * scale}px`;
      rot.style.height = `${3.5 * scale}px`;
      rot.style.borderRadius = "50%";
      rot.style.backgroundColor = "rgb(50, 50, 55)";
      rot.style.zIndex = "3";
      parentEl.appendChild(rot);
    });
  }
  else if (type === "mini_iha") {
    const wings = document.createElement("div");
    wings.style.position = "absolute";
    wings.style.left = `${(w * 0.4) * scale}px`;
    wings.style.top = `${(-9) * scale}px`;
    wings.style.width = `${3 * scale}px`;
    wings.style.height = `${(h + 18) * scale}px`;
    wings.style.backgroundColor = color;
    wings.style.borderRadius = "1px";
    wings.style.zIndex = "1";
    parentEl.appendChild(wings);

    const prop = document.createElement("div");
    prop.style.position = "absolute";
    prop.style.right = `${(-1.5) * scale}px`;
    prop.style.top = `${(-1.5) * scale}px`;
    prop.style.width = `${1.5 * scale}px`;
    prop.style.height = `${(h + 3) * scale}px`;
    prop.style.backgroundColor = "rgb(80, 80, 80)";
    prop.style.zIndex = "3";
    parentEl.appendChild(prop);

    const tailplane = document.createElement("div");
    tailplane.style.position = "absolute";
    tailplane.style.left = `${(w * 0.08) * scale}px`;
    tailplane.style.top = `${(-3) * scale}px`;
    tailplane.style.width = `${2 * scale}px`;
    tailplane.style.height = `${(h + 6) * scale}px`;
    tailplane.style.backgroundColor = color;
    tailplane.style.zIndex = "1";
    parentEl.appendChild(tailplane);

    const camera = document.createElement("div");
    camera.style.position = "absolute";
    camera.style.right = "0";
    camera.style.top = "20%";
    camera.style.width = `${3 * scale}px`;
    camera.style.height = "60%";
    camera.style.backgroundColor = "rgb(0, 255, 0)";
    camera.style.borderRadius = "50%";
    camera.style.zIndex = "3";
    parentEl.appendChild(camera);
  }
  else if (type === "mam_t") {
    const wings = document.createElement("div");
    wings.style.position = "absolute";
    wings.style.left = `${(w * 0.4) * scale}px`;
    wings.style.top = `${(-7) * scale}px`;
    wings.style.width = `${4 * scale}px`;
    wings.style.height = `${(h + 14) * scale}px`;
    wings.style.backgroundColor = color;
    wings.style.borderRadius = "1px";
    wings.style.zIndex = "1";
    parentEl.appendChild(wings);

    const tail = document.createElement("div");
    tail.style.position = "absolute";
    tail.style.left = `${(w * 0.08) * scale}px`;
    tail.style.top = `${(-4) * scale}px`;
    tail.style.width = `${2 * scale}px`;
    tail.style.height = `${(h + 8) * scale}px`;
    tail.style.backgroundColor = color;
    tail.style.zIndex = "1";
    parentEl.appendChild(tail);

    const nose = document.createElement("div");
    nose.style.position = "absolute";
    nose.style.right = "0";
    nose.style.top = "20%";
    nose.style.width = `${3.5 * scale}px`;
    nose.style.height = "60%";
    nose.style.backgroundColor = "rgb(255, 0, 0)";
    nose.style.borderRadius = "50%";
    nose.style.zIndex = "3";
    parentEl.appendChild(nose);
  }
  else if (type === "mam_l") {
    const wings = document.createElement("div");
    wings.style.position = "absolute";
    wings.style.left = `${(w * 0.4) * scale}px`;
    wings.style.top = `${(-4) * scale}px`;
    wings.style.width = `${3 * scale}px`;
    wings.style.height = `${(h + 8) * scale}px`;
    wings.style.backgroundColor = color;
    wings.style.borderRadius = "1px";
    wings.style.zIndex = "1";
    parentEl.appendChild(wings);

    const tail = document.createElement("div");
    tail.style.position = "absolute";
    tail.style.left = `${(w * 0.08) * scale}px`;
    tail.style.top = `${(-3) * scale}px`;
    tail.style.width = `${1.5 * scale}px`;
    tail.style.height = `${(h + 6) * scale}px`;
    tail.style.backgroundColor = color;
    tail.style.zIndex = "1";
    parentEl.appendChild(tail);

    const nose = document.createElement("div");
    nose.style.position = "absolute";
    nose.style.right = "0";
    nose.style.top = "20%";
    nose.style.width = `${3 * scale}px`;
    nose.style.height = "60%";
    nose.style.backgroundColor = "rgb(255, 0, 0)";
    nose.style.borderRadius = "50%";
    nose.style.zIndex = "3";
    parentEl.appendChild(nose);
  }
  else if (type === "cakir") {
    const wingTop = document.createElement("div");
    wingTop.style.position = "absolute";
    wingTop.style.left = `${(w * 0.42) * scale}px`;
    wingTop.style.bottom = "100%";
    wingTop.style.width = `${6 * scale}px`;
    wingTop.style.height = `${12 * scale}px`;
    wingTop.style.backgroundColor = color;
    wingTop.style.borderRadius = "2px";
    wingTop.style.transformOrigin = "bottom left";
    wingTop.style.transform = "skewX(25deg)";
    wingTop.style.zIndex = "1";
    parentEl.appendChild(wingTop);

    const wingBottom = document.createElement("div");
    wingBottom.style.position = "absolute";
    wingBottom.style.left = `${(w * 0.42) * scale}px`;
    wingBottom.style.top = "100%";
    wingBottom.style.width = `${6 * scale}px`;
    wingBottom.style.height = `${12 * scale}px`;
    wingBottom.style.backgroundColor = color;
    wingBottom.style.borderRadius = "2px";
    wingBottom.style.transformOrigin = "top left";
    wingBottom.style.transform = "skewX(-25deg)";
    wingBottom.style.zIndex = "1";
    parentEl.appendChild(wingBottom);

    const intakeTop = document.createElement("div");
    intakeTop.style.position = "absolute";
    intakeTop.style.left = `${(w * 0.22) * scale}px`;
    intakeTop.style.top = `${(-1.5) * scale}px`;
    intakeTop.style.width = `${6 * scale}px`;
    intakeTop.style.height = `${2 * scale}px`;
    intakeTop.style.backgroundColor = "rgb(30, 30, 35)";
    intakeTop.style.zIndex = "3";
    parentEl.appendChild(intakeTop);

    const intakeBottom = document.createElement("div");
    intakeBottom.style.position = "absolute";
    intakeBottom.style.left = `${(w * 0.22) * scale}px`;
    intakeBottom.style.bottom = `${(-1.5) * scale}px`;
    intakeBottom.style.width = `${6 * scale}px`;
    intakeBottom.style.height = `${2 * scale}px`;
    intakeBottom.style.backgroundColor = "rgb(30, 30, 35)";
    intakeBottom.style.zIndex = "3";
    parentEl.appendChild(intakeBottom);

    const finTop = document.createElement("div");
    finTop.style.position = "absolute";
    finTop.style.left = `${(w * 0.05) * scale}px`;
    finTop.style.bottom = "100%";
    finTop.style.width = `${3 * scale}px`;
    finTop.style.height = `${6 * scale}px`;
    finTop.style.backgroundColor = color;
    parentEl.appendChild(finTop);

    const finBottom = document.createElement("div");
    finBottom.style.position = "absolute";
    finBottom.style.left = `${(w * 0.05) * scale}px`;
    finBottom.style.top = "100%";
    finBottom.style.width = `${3 * scale}px`;
    finBottom.style.height = `${6 * scale}px`;
    finBottom.style.backgroundColor = color;
    parentEl.appendChild(finBottom);

    const nose = document.createElement("div");
    nose.style.position = "absolute";
    nose.style.right = "0";
    nose.style.top = "15%";
    nose.style.width = `${5 * scale}px`;
    nose.style.height = "70%";
    nose.style.backgroundColor = "rgb(255, 0, 128)";
    nose.style.borderRadius = "50%";
    nose.style.zIndex = "3";
    parentEl.appendChild(nose);
  }
}
