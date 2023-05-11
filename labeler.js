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

// Define the options for the popup menu
const options = ["Option 1", "Option 2", "Option 3"];

// Create the popup menu element
const menu = document.createElement("div");
menu.classList.add("popup-menu");

// Create an option element for each option
options.forEach((option, index) => {
  const optionElement = document.createElement("div");
  optionElement.classList.add("popup-menu-option");
  optionElement.textContent = option;
  optionElement.dataset.index = index;
  menu.appendChild(optionElement);
});

// Add the menu to the document
document.body.appendChild(menu);

// Hide the menu initially
menu.style.display = "none";

// Track the currently selected option
let selectedOption = null;

// Handle the 'u' key press
document.addEventListener("keydown", (event) => {
  if (event.key === "u") {
    // Show the menu
    menu.style.display = "block";
    console.log('In pop up menu!')

    // Position the menu at the current mouse cursor position
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let menuX = mouseX;
    let menuY = mouseY;

    if (menuX + menuWidth > windowWidth) {
      menuX = windowWidth - menuWidth;
    }

    if (menuY + menuHeight > windowHeight) {
      menuY = windowHeight - menuHeight;
    }

    menu.style.left = menuX + "px";
    menu.style.top = menuY + "px";

    // Add a click event listener to the menu options
    menu.querySelectorAll(".popup-menu-option").forEach((option) => {
      option.addEventListener("click", () => {
        // Store the selected option and hide the menu
        selectedOption = options[option.dataset.index];
        menu.style.display = "none";
      });
    });
  }
});

// Add some basic CSS styles for the menu and options
menu.style.position = "absolute";
menu.style.padding = "10px";
menu.style.backgroundColor = "#fff";
menu.style.border = "1px solid #000";
menu.style.width = "200px";
menu.style.zIndex = 100;

menu.querySelectorAll(".popup-menu-option").forEach((option) => {
  option.style.padding = "5px";
  option.style.cursor = "pointer";
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
