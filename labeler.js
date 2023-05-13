function getXPathsForSelectedText() {
  let xpaths = [];

  let selection = window.getSelection();
  if (selection.rangeCount) {
    let range = selection.getRangeAt(0);
    let startNode = range.startContainer.parentNode.parentNode;
    let endNode = range.endContainer.parentNode.parentNode;
    let nodeList = [];
    console.log(range.startContainer);
    console.log(range.commonAncestorContainer);
    console.log(startNode);
    while(startNode != endNode.nextElementSibling && startNode != null){
      
      
      if (startNode.innerText.length == 1){
        startNode = startNode.nextElementSibling;
        continue;
      }
      nodeList.push(startNode.firstChild);
      startNode = startNode.nextElementSibling;
    }

    for(let i = 0; i < nodeList.length; i++){
      let xpath_ = getXPath(nodeList[i]);
      xpaths.push(xpath_);
    }
  }
  full_path_list = xpaths[0].split('/');
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
let isMenuOpen = false;
let mouseX;
let mouseY;
let selectedOption = null;
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
    highlightedNodeText = [...highlightedText.split('\n\n')].filter(text => text.length != 1).map(text => text.trim());
    const xpaths = getXPathsForSelectedText();
    console.log(highlightedNodeText);
    old_highlighted_texts = JSON.parse(localStorage.getItem('text'));
    old_xpaths = JSON.parse(localStorage.getItem('xpaths'));

    // Add code here to open dialog box to select label type. Create list
    // for both highlighted text and xpaths for [text: TextList, label: int], 
    // [xpath: xpathlist, label: int]. Mapping done by index.
    let label = '';
    if (!isMenuOpen){
      isMenuOpen = true;
      mouseX = event.pageX;
      mouseY = event.pageY;
      console.log('opening label selector!')
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
      
      const sec_num = menuWindow.document.createElement("button");
      const sec_title = menuWindow.document.createElement("button");
      const pn = menuWindow.document.createElement("button");
      const ot = menuWindow.document.createElement("button");
      
      let label_list = [sec_title, sec_num, pn, ot];
      
      const labelctx = ['SecTitle0', 'SecNum0', 'PageNum', 'Outside'];
      const labelnm = ['sectitle0', 'secnum0', 'pn', 'ot'];
      
      for (let i = 0; i < label_list.length; i++){
        lb = label_list[i];
        lb.textContent = labelctx[i];
        lb.style.margin = "10px";
        lb.addEventListener("click", () => {
          selectedOption = labelctx[i];
          isMenuOpen = false;
          label = labelnm[i];
          menuWindow.close();
        });
        dialog.appendChild(lb);
      }
    }

    old_highlighted_texts.push(highlightedNodeText);
    old_xpaths.push(xpaths);
    localStorage.setItem('text', JSON.stringify(old_highlighted_texts));
    localStorage.setItem('xpaths', JSON.stringify(old_xpaths));
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
