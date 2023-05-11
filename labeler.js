function getXPathsForSelectedText() {
  let xpaths = [];
  let selection = window.getSelection();
  if (selection.rangeCount) {
    let range = selection.getRangeAt(0);
    let node = range.commonAncestorContainer;

    while (node != document.body) {
      let xpath = getXPath(node);
      xpaths.push(xpath);
      node = node.parentNode;
    }
  }
  return xpaths;
}


var old_highlighted_texts = []; 
var old_xpaths = [];


localStorage.setItem('text', JSON.stringify(old_highlighted_texts));
localStorage.setItem('xpaths', JSON.stringify(old_xpaths));


function getXPath(node) {
  let xpath = '';
  let count;

  while (node != null && node.nodeType != Node.DOCUMENT_NODE) {
    
    let id = node.id ? `[@id="${node.id}"]` : '';
    let nodeName = node.nodeName.toLowerCase();
    //let tag = node.tagName.toLowerCase();
    let siblings = [...node.parentNode.children].filter(n => n.nodeName === nodeName); // changed tagName to nodeName
    count = siblings.indexOf(node) + 1;
    count = count > 1 ? `[${count}]` : '';
    xpath = `/${nodeName}${id}${count}${xpath}`;
    node = node.parentNode;
  }

  return xpath;
}

function downloadObjectAsJson(exportObj, exportName){
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }


document.addEventListener('keydown', (event) => {
  if (event.key === 'e') {
    event.preventDefault(); // prevent default behavior of the 'e' key
    const highlightedText = window.getSelection().toString();
    //console.log(highlightedText);
    const xpaths = getXPathsForSelectedText();
    //console.log(xpaths);
    const myBlogs = ["https://catalins.tech", "https://exampleblog.com"];

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
