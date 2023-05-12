function getXPathsForSelectedText() {
  let xpaths = [];

  let selection = window.getSelection();
  if (selection.rangeCount) {
    let range = selection.getRangeAt(0);
    let startNode = range.startContainer.parentNode.parentNode;
    let endNode = range.endContainer.parentNode.parentNode;
    let nodeList = [];
    while(startNode != endNode.nextElementSibling){
      if (startNode.innerHTML.includes('&nbsp;') && startNode.innerText.length == 1){
        startNode = startNode.nextElementSibling;
        continue;
      }
      nodeList.push(startNode.firstChild);
      startNode = startNode.nextElementSibling;
    }
    
    let node = range.commonAncestorContainer;
    
    console.log(nodeList[0]);
    for(let i = 0; i < nodeList.length; i++){
      let xpath_ = getXPath(nodeList[i]);
      xpaths.push(xpath_);
    }
    // while (node != document.body) {
    //   let xpath = getXPath(node);
    //   xpaths.push(xpath);
    //   node = node.parentNode;
    // }
  }
  full_path_list = xpaths[0].split('/');
  // if (['font', '#text', 'u', 'b', 'i'].includes(full_path_list.at(-1))) {
  //   xpaths = xpaths.slice(0, 2);
  // } else {
  //   xpaths = xpaths[0];
  // }
  console.log(xpaths);
  return xpaths;
}


var old_highlighted_texts = [];
var old_xpaths = [];


localStorage.setItem('text', JSON.stringify(old_highlighted_texts));
localStorage.setItem('xpaths', JSON.stringify(old_xpaths));

const getMethods = (obj) => {
  let properties = new Set()
  let currentObj = obj
  do {
    Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
  } while ((currentObj = Object.getPrototypeOf(currentObj)))
  return [...properties.keys()].filter(item => typeof obj[item] === 'function')
}

function getXPath(node) {
  let xpath = '';
  let count;

  while (node != null && node.nodeType != Node.DOCUMENT_NODE) {
    let id = node.id ? `[@id="${node.id}"]` : '';

    let nodeName = node.nodeName.toLowerCase();
    let siblings = [...node.parentNode.children].filter(n => n.nodeName === nodeName);
    counter = 0;
    for (const child of node.parentNode.children) {
      lcName = child.nodeName.toLowerCase();
      if (lcName === nodeName) {
        counter += 1;
        if (child.isEqualNode(node)) {
          break;
        }
      }
    }
    if (counter > 1) {
      xpath = `/${nodeName}[${counter}]${xpath}`;
    } else {
      xpath = `/${nodeName}${xpath}`;
    }
    node = node.parentNode;
  }
  return xpath;
}

function downloadObjectAsJson(exportObj, exportName) {
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
  var downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", exportName + ".json");
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}


document.addEventListener('keydown', (event) => {
  if (event.key === 'e') {
    event.preventDefault();
    const highlightedText = window.getSelection().toString();
    const xpaths = getXPathsForSelectedText();

    old_highlighted_texts = JSON.parse(localStorage.getItem('text'));
    old_xpaths = JSON.parse(localStorage.getItem('xpaths'));

    old_highlighted_texts.push(highlightedText)
    old_xpaths.push(xpaths)

    localStorage.setItem('text', JSON.stringify(old_highlighted_texts));
    localStorage.setItem('xpaths', JSON.stringify(old_xpaths));


  }
});

let isMenuOpen = false;
let mouseX;
let mouseY;
let selectedOption = null;

document.addEventListener("keydown", (event) => {
  if (event.key === "u" && !isMenuOpen) {
    isMenuOpen = true;
    mouseX = event.pageX;
    mouseY = event.pageY;
    console.log('in event u!')
    const menuWindow = window.open("", "Dialog Box", `width=400,height=200,top=${mouseY},left=${mouseX}`);
    const dialog = menuWindow.document.createElement("div");
    dialog.style.display = "flex";
    dialog.style.flexDirection = "column";
    dialog.style.justifyContent = "center";
    dialog.style.alignItems = "center";
    menuWindow.document.body.appendChild(dialog);

    const message = menuWindow.document.createElement("p");
    message.textContent = "Please select an option:";
    message.style.fontSize = "20px";
    dialog.appendChild(message);

    const option1 = menuWindow.document.createElement("button");
    option1.textContent = "Option 1";
    option1.style.margin = "10px";
    option1.addEventListener("click", () => {
      selectedOption = "Option 1";
      isMenuOpen = false;
      menuWindow.close();
    });
    dialog.appendChild(option1);

    const option2 = menuWindow.document.createElement("button");
    option2.textContent = "Option 2";
    option2.style.margin = "10px";
    option2.addEventListener("click", () => {
      selectedOption = "Option 2";
      isMenuOpen = false;
      menuWindow.close();
    });
    dialog.appendChild(option2);
  }
});


document.addEventListener('keydown', (event) => {
  if (event.key === 'b') {
    console.log(localStorage)
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'p') {
    downloadObjectAsJson(localStorage, 'contract_saved.json')
  }
});
