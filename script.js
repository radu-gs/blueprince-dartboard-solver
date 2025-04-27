function populateInfoBox() {
  let info = document.getElementById('infosource').innerHTML;
  for (const infobox of document.getElementsByClassName('infobox')) {
    infobox.innerHTML = info;
  }

}

let opnames = ["None", "Addition/Blue", "Subtraction/Yellow", "Multiplication/Pink", "Division/Purple"];
let currentColors = [0, 0, 0, 0];
let bullColor = 0;

function toggleColor(element) {
  let value = parseInt(element.getAttribute("value"));
  value = (value + 1) % 5;
  element.setAttribute("value", value.toString())
  let id = element.getAttribute("id")

  document.getElementById(id + 'color').setAttribute('class', 'colorCell cellcolor'+value);
  document.getElementById(id + 'label').textContent = opnames[value];
  if (id.includes('ring')) {
    let ringIndex = parseInt(element.getAttribute("id").split("ringt")[1]) - 1;
    currentColors[ringIndex] = value;
    for (const path of document.querySelectorAll('g[id^="ring' + (ringIndex + 1).toString() + '"] > path:not([state="0"])')) {
      updateScoreSector(path)
    }
  }
  else {
    bullColor = value;
    let bullbackground = document.getElementById('bullbg')
    if (value == 0) bullbackground.removeAttribute('class')
    else bullbackground.setAttribute('class', 'sector' + value + ' sectorline')
  }
}

function getResult() {
  let valuearray = [[], [], [], []];

  // 0: none 
  // 1: roundx1 
  // 2: roundx10 
  // 3: roundx100 
  // 4: square 
  // 5: double square ^4 
  // 6: reverse
  let obullstate = parseInt(document.getElementById("outerbull").getAttribute("state"));

  // 0: none 
  // 1: square
  // 2: double square ^4
  // 3: reverse
  let ibullstate = parseInt(document.getElementById("innerbull").getAttribute("state"));

  // 0: normal 
  // 1: div 2
  // 2: null 
  // 3: operation x2 
  // 4: operation x3 
  // 5: operation x4 
  // 6: reverse
  // 7: square
  // 8: double square ^4
  let modArray = new Array(20).fill(0);

  let oparray = ['', '+', '-', '*', '/']

  let resultScope = { result: 0 }

  // resultScope.result=math.evaluate(expression, resultScope)

  //get the outer rim modifiers
  for (const path of document.querySelectorAll('g[id="modmask"] > path:not([state="0"])')) {
    let currentIndex = parseInt(path.getAttribute("id").split("-")[1])
    modArray[currentIndex - 1] = parseInt(path.getAttribute("state"))
  }

  //populate every of the 4 ring arrays
  for (let index = 0; index <= 3; index++) {

    //skip uncolored sectors
    if (currentColors[index] != 0) {

      //skip unselected sectors
      for (const path of document.querySelectorAll('g[id^="ring' + (index + 1).toString() + '"] > path:not([state="0"])')) {
        let sectorValue = parseInt(path.getAttribute("id").split("-")[1]);

        //skip if crossed
        if (modArray[sectorValue - 1] != 2) {

          //add a third for incomplete segments
          let sectorstate = parseInt(path.getAttribute("state"))
          valuearray[index].push({
            number: sectorValue,
            third: sectorstate - 1
          })
        }
      }
    }
  }

  /*
  
      Calculations
  
  initial logic:
  
    initial result = 0
    foreach ring
        foreach sector
          for i<=repeats i++
            reverse?
            third?
            square/double?
            result = result <operation> sector.value
            div by 2?
        if bullseye
          result = result.innermod
          result = result.outermod
  
  */


  for (let ring = 0; ring < valuearray.length; ring++) {
    for (let boardvalue of valuearray[ring]) {
      let operationstring = '';
      let modvalue = modArray[boardvalue.number - 1]

      //get number of repeats
      let repeats = 0;
      if (modvalue >= 3 && modvalue <= 5) repeats = modvalue - 2;

      //reverse number
      if (modvalue == 6) boardvalue.number = parseInt(Math.abs(boardvalue.number).toString().split('').reverse().join('')) * Math.sign(boardvalue.number);

      //add symbol
      operationstring += oparray[currentColors[ring]]

      //is it a third?
      if (boardvalue.third == 1)
        operationstring += '(' + boardvalue.number.toString() + '/3)'
      else operationstring += boardvalue.number.toString()

      //is it squared/doubled?
      if (modvalue == 7) operationstring += '^2'
      if (modvalue == 8) operationstring += '^4'

      //perform operation respecting repeats
      for (let index = 0; index <= repeats; index++) {
        resultScope.result = math.evaluate('result' + operationstring, resultScope)
      }

      //divide result by 2
      if (modvalue == 1)
        resultScope.result = math.evaluate('result/2', resultScope)
    }
    if (currentColors[ring] == bullColor) {

      //inner bullseye first
      switch (ibullstate) {
        case 1:
          resultScope.result = math.evaluate('result^2', resultScope)
          break;
        case 2:
          resultScope.result = math.evaluate('result^4', resultScope)
          break;
        case 3:
          resultScope.result = parseInt(Math.abs(resultScope.result).toString().split('').reverse().join('')) * Math.sign(resultScope.result)
        default:
      }

      //outer bullseye next
      switch (obullstate) {
        case 1:
          resultScope.result = math.evaluate('round(result)', resultScope)
          break;
        case 2:
          resultScope.result = math.evaluate('round(result/10)*10', resultScope)
          break;
        case 3:
          resultScope.result = math.evaluate('round(result/100)*100', resultScope)
          break;
        case 4:
          resultScope.result = math.evaluate('result^2', resultScope)
          break;
        case 5:
          resultScope.result = math.evaluate('result^4', resultScope)
          break;
        case 6:
          resultScope.result = parseInt(Math.abs(resultScope.result).toString().split('').reverse().join('')) * Math.sign(resultScope.result)
        default:
      }
    }

  }

  document.getElementById("resultField").textContent = resultScope.result.toString()
}

function toggleScoreSector(element) {
  let elstate = parseInt(element.getAttribute("state"));
  elstate = (elstate + 1) % 3;
  element.setAttribute("state", elstate.toString());
  updateScoreSector(element)
}

function updateScoreSector(element) {
  let elstate = parseInt(element.getAttribute("state"));
  let ring = parseInt(element.getAttribute("id").split("ring")[1].split("-")[0]);
  let targetcolor = currentColors[ring - 1];
  switch (elstate) {
    case 0:
      element.removeAttribute('class');
      break;
    case 1:
      element.setAttribute('class', 'sector' + targetcolor + ' sectorline')
      break;
    case 2:
      element.setAttribute('class', 'sector' + targetcolor + ' sectorline sectormask')
  }
}

function resetBoard() {

  for (let button of document.getElementsByClassName('colorbutton')) {
    button.setAttribute('value', 4);
    toggleColor(button)
  }

  for (const path of document.querySelectorAll('g[id^="ring"] > path:not([state="0"])')) {
    path.setAttribute("state", "0")
    path.removeAttribute("class");
  }
  for (const path of document.querySelectorAll('g[id^="modicon-"] *, g[id="innermods"] *, g[id="outerbullmods"] *')) {
    path.setAttribute("display", "none");
  }
  for (const path of document.querySelectorAll('[state]:not([state="0"])')) {
    path.setAttribute("state", "0")
  }

  document.getElementById("resultField").textContent = "0"

}

function toggleRimModState(element) {
  let elstate = parseInt(element.getAttribute("state")) || 0;
  let boardsection = element.getAttribute("id").split("-")[1];

  let icon_strike = document.getElementById("modicon-" + boardsection + "-strike");
  let icon_div = document.getElementById("modicon-" + boardsection + "-div");
  let icon_rimdiamond = document.getElementById("modicon-" + boardsection + "-rimdiamond");
  let icon_dot1 = document.getElementById("modicon-" + boardsection + "-dot1");
  let icon_dot2 = document.getElementById("modicon-" + boardsection + "-dot2");
  let icon_dot3 = document.getElementById("modicon-" + boardsection + "-dot3");
  let icon_dot4 = document.getElementById("modicon-" + boardsection + "-dot4");
  let icon_rimsquare = document.getElementById("modicon-" + boardsection + "-square");
  let icon_rimdoublesquare = document.getElementById("modicon-" + boardsection + "-doublesquare");
  elstate = (elstate + 1) % 9;
  element.setAttribute("state", elstate.toString());

  switch (elstate) {
    case 0: //none
      icon_strike.setAttribute("display", "none");
      icon_div.setAttribute("display", "none");
      icon_rimdiamond.setAttribute("display", "none");
      icon_dot1.setAttribute("display", "none");
      icon_dot2.setAttribute("display", "none");
      icon_dot3.setAttribute("display", "none");
      icon_dot4.setAttribute("display", "none");
      icon_rimsquare.setAttribute("display", "none");
      icon_rimdoublesquare.setAttribute("display", "none");
      break;
    case 1: //div
      icon_strike.setAttribute("display", "none");
      icon_div.setAttribute("display", "inline");
      icon_rimdiamond.setAttribute("display", "none");
      icon_dot1.setAttribute("display", "none");
      icon_dot2.setAttribute("display", "none");
      icon_dot3.setAttribute("display", "none");
      icon_dot4.setAttribute("display", "none");
      icon_rimsquare.setAttribute("display", "none");
      icon_rimdoublesquare.setAttribute("display", "none");
      break;
    case 2: //strike
      icon_strike.setAttribute("display", "inline");
      icon_div.setAttribute("display", "inline");
      icon_rimdiamond.setAttribute("display", "none");
      icon_dot1.setAttribute("display", "none");
      icon_dot2.setAttribute("display", "none");
      icon_dot3.setAttribute("display", "none");
      icon_dot4.setAttribute("display", "none");
      icon_rimsquare.setAttribute("display", "none");
      icon_rimdoublesquare.setAttribute("display", "none");
      break;
    case 3: //2dots
      icon_strike.setAttribute("display", "none");
      icon_div.setAttribute("display", "none");
      icon_rimdiamond.setAttribute("display", "none");
      icon_dot1.setAttribute("display", "none");
      icon_dot2.setAttribute("display", "inline");
      icon_dot3.setAttribute("display", "inline");
      icon_dot4.setAttribute("display", "none");
      icon_rimsquare.setAttribute("display", "none");
      icon_rimdoublesquare.setAttribute("display", "none");
      break;
    case 4: //3dots
      icon_strike.setAttribute("display", "none");
      icon_div.setAttribute("display", "none");
      icon_rimdiamond.setAttribute("display", "none");
      icon_dot1.setAttribute("display", "inline");
      icon_dot2.setAttribute("display", "inline");
      icon_dot3.setAttribute("display", "inline");
      icon_dot4.setAttribute("display", "none");
      icon_rimsquare.setAttribute("display", "none");
      icon_rimdoublesquare.setAttribute("display", "none");
      break;
    case 5: //4dots
      icon_strike.setAttribute("display", "none");
      icon_div.setAttribute("display", "none");
      icon_rimdiamond.setAttribute("display", "none");
      icon_dot1.setAttribute("display", "inline");
      icon_dot2.setAttribute("display", "inline");
      icon_dot3.setAttribute("display", "inline");
      icon_dot4.setAttribute("display", "inline");
      icon_rimsquare.setAttribute("display", "none");
      icon_rimdoublesquare.setAttribute("display", "none");
      break;

    case 6: //diamond-reverse
      icon_strike.setAttribute("display", "none");
      icon_div.setAttribute("display", "none");
      icon_rimdiamond.setAttribute("display", "inline");
      icon_dot1.setAttribute("display", "none");
      icon_dot2.setAttribute("display", "none");
      icon_dot3.setAttribute("display", "none");
      icon_dot4.setAttribute("display", "none");
      icon_rimsquare.setAttribute("display", "none");
      icon_rimdoublesquare.setAttribute("display", "none");
      break;
    case 7: //square
      icon_strike.setAttribute("display", "none");
      icon_div.setAttribute("display", "none");
      icon_rimdiamond.setAttribute("display", "none");
      icon_dot1.setAttribute("display", "none");
      icon_dot2.setAttribute("display", "none");
      icon_dot3.setAttribute("display", "none");
      icon_dot4.setAttribute("display", "none");
      icon_rimsquare.setAttribute("display", "inline");
      icon_rimdoublesquare.setAttribute("display", "none");
      break;
    case 8: //double square ^4
      icon_strike.setAttribute("display", "none");
      icon_div.setAttribute("display", "none");
      icon_rimdiamond.setAttribute("display", "none");
      icon_dot1.setAttribute("display", "none");
      icon_dot2.setAttribute("display", "none");
      icon_dot3.setAttribute("display", "none");
      icon_dot4.setAttribute("display", "none");
      icon_rimsquare.setAttribute("display", "none");
      icon_rimdoublesquare.setAttribute("display", "inline");
      break;
    default:
      console.warn("Unexpected state value:", elstate);
  }
}

function toggleInnerBullState(element) {

  let icon_square = document.getElementById("square");
  let icon_diamond = document.getElementById("diamond");
  let icon_doublesquare = document.getElementById("doublesquare");

  let elstate = parseInt(element.getAttribute("state")) || 0;

  elstate = (elstate + 1) % 4;
  element.setAttribute("state", elstate);

  switch (elstate) {
    case 0:
      icon_square.setAttribute("display", "none");
      icon_diamond.setAttribute("display", "none");
      icon_doublesquare.setAttribute("display", "none");
      break;
    case 1:
      icon_square.setAttribute("display", "inline");
      icon_diamond.setAttribute("display", "none");
      icon_doublesquare.setAttribute("display", "none");
      break;
    case 2:
      icon_square.setAttribute("display", "none");
      icon_diamond.setAttribute("display", "none");
      icon_doublesquare.setAttribute("display", "inline");
      break;
    case 3:
      icon_square.setAttribute("display", "none");
      icon_diamond.setAttribute("display", "inline");
      icon_doublesquare.setAttribute("display", "none");
      break;
  }
}

function toggleOuterBullState(element) {
  let osquare = document.getElementById("osquare")
  let odoublesquare = document.getElementById("odoublesquare")
  let odiamond = document.getElementById("odiamond")
  let line1 = document.getElementById("line1")
  let line3 = document.getElementById("line3")
  let line2 = document.getElementById("line2")


  let elstate = parseInt(element.getAttribute("state")) || 0;
  elstate = (elstate + 1) % 7;
  element.setAttribute("state", elstate);
  switch (elstate) {
    case 0:
      osquare.setAttribute("display", "none");
      odoublesquare.setAttribute("display", "none");
      odiamond.setAttribute("display", "none");
      line1.setAttribute("display", "none");
      line3.setAttribute("display", "none");
      line2.setAttribute("display", "none");
      break;
    case 1:
      osquare.setAttribute("display", "none");
      odoublesquare.setAttribute("display", "none");
      odiamond.setAttribute("display", "none");
      line1.setAttribute("display", "inline");
      line3.setAttribute("display", "none");
      line2.setAttribute("display", "none");
      break;
    case 2:
      osquare.setAttribute("display", "none");
      odoublesquare.setAttribute("display", "none");
      odiamond.setAttribute("display", "none");
      line1.setAttribute("display", "inline");
      line3.setAttribute("display", "inline");
      line2.setAttribute("display", "none");
      break;
    case 3:
      osquare.setAttribute("display", "none");
      odoublesquare.setAttribute("display", "none");
      odiamond.setAttribute("display", "none");
      line1.setAttribute("display", "inline");
      line3.setAttribute("display", "inline");
      line2.setAttribute("display", "inline");
      break;
    case 4:
      osquare.setAttribute("display", "inline");
      odoublesquare.setAttribute("display", "none");
      odiamond.setAttribute("display", "none");
      line1.setAttribute("display", "none");
      line3.setAttribute("display", "none");
      line2.setAttribute("display", "none");
      break;
    case 5:
      osquare.setAttribute("display", "none");
      odoublesquare.setAttribute("display", "inline");
      odiamond.setAttribute("display", "none");
      line1.setAttribute("display", "none");
      line3.setAttribute("display", "none");
      line2.setAttribute("display", "none");
      break;
    case 6:
      osquare.setAttribute("display", "none");
      odoublesquare.setAttribute("display", "none");
      odiamond.setAttribute("display", "inline");
      line1.setAttribute("display", "none");
      line3.setAttribute("display", "none");
      line2.setAttribute("display", "none");
  }
}