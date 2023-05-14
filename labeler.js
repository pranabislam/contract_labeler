function removeHighlightBox(highlightBox) {
    
    // Remove highlightBox from the DOM
    highlightBox.remove();
    // Remove text entry from local storage
    highlighted_texts = JSON.parse(localStorage.getItem('text'));
    xpaths = JSON.parse(localStorage.getItem('xpaths'));
    
    const delete_idx = highlightBox.getAttribute('idx');

    highlighted_texts[delete_idx] = 'DELETED';
    xpaths[delete_idx] = 'DELETED';
    
    console.log(localStorage['text'])
    console.log('++++++++++++++++++++++++++++++++++')
    console.log(localStorage['xpaths'])
    console.log('++++++++++++++++++++++++++++++++++')
    // Right now it's very inefficient as we are constantly parsing and iterating through the entire string / list
    localStorage.setItem('text', JSON.stringify(highlighted_texts));
    localStorage.setItem('xpaths', JSON.stringify(xpaths));
    // Delete highlightBox from DOM

    console.log(localStorage['text'])
    console.log('++++++++++++++++++++++++++++++++++')
    console.log(localStorage['xpaths'])
    console.log('++++++++++++++++++++++++++++++++++')
}

// I think I need to feed in XPATHS! and the text to highlight would work too -- its all indexed?
function highlightText(selectionRange, label, idx) {
    const rect = selectionRange.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const top_ = rect.top + scrollTop;
    const left = rect.left + scrollLeft;
    
    // Create a new highlight box element
    const highlightBox = document.createElement('div');
    highlightBox.style.position = 'absolute';
    highlightBox.style.top = top_ + 'px';
    highlightBox.style.left = left + 'px';
    highlightBox.style.width = rect.width + 'px';
    highlightBox.style.height = rect.height + 'px';
    highlightBox.style.backgroundColor = 'yellow';
    highlightBox.style.opacity = '0.5';
    highlightBox.style.zIndex = '99999'; // Set a high z-index value
    
    const labelAttribute = document.createAttribute("label");
    labelAttribute.value = label;
    highlightBox.setAttributeNode(labelAttribute);

    const idxAttribute = document.createAttribute("idx");
    idxAttribute.value = idx;
    highlightBox.setAttributeNode(idxAttribute);
    
    // Add event listener to retrieve and print label property on click
    highlightBox.addEventListener('click', () => {
        const label = highlightBox.getAttribute('label');
        console.log(label);

        // Toggle the selected state of the highlight box only if it is not already selected
        const isSelected = highlightBox.getAttribute('selected') === 'true';
        if (!isSelected) {
            highlightBox.setAttribute('selected', 'true');
            highlightBox.style.border = '2px solid red'; // Add red border when selected

            // Create a dialog box to delete the highlight box
            highlightBox.dialogBox = window.open("", "Delete Highlight Box", "height=200,width=400");
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.style.margin = '10px';
            deleteButton.addEventListener('click', () => {
                removeHighlightBox(highlightBox);
                highlightBox.dialogBox.close();
            });
            highlightBox.dialogBox.document.body.appendChild(deleteButton);
        }
    });

    // Add event listener to remove red border when de-selected
    document.addEventListener('click', (event) => {
        if (!highlightBox.contains(event.target)) {
        highlightBox.setAttribute('selected', 'false');
        highlightBox.style.border = 'none'; // Remove red border when de-selected
        if (highlightBox.dialogBox && !highlightBox.dialogBox.close){ // if dialog box is still open but we select anotherhighlightbox
            highlightBox.dialogBox.close();
        }
    }
    });
    return highlightBox
}

function getXPathsForSelectedText() {
    let sel = window.getSelection();
    let range = sel.getRangeAt(0);
    let container = range.commonAncestorContainer;
    let nodeXPaths = [];
  
    function getXPath(node) {
      let xpath = '';
      for (; node && node.nodeType == Node.ELEMENT_NODE; node = node.parentNode) {
        let siblings = Array.from(node.parentNode.childNodes).filter(sibling => sibling.nodeName === node.nodeName);
        if (siblings.length > 1) {
          let index = siblings.indexOf(node) + 1;
          xpath = `/${node.nodeName.toLowerCase()}[${index}]${xpath}`;
        } else {
          xpath = `/${node.nodeName.toLowerCase()}${xpath}`;
        }
      }
      return xpath;
    }
  
    function traverse(node) {
      if (range.intersectsNode(node)) {
        if (node.nodeType === Node.TEXT_NODE) {
          if (node.textContent.trim().length > 0) {
            nodeXPaths.push(getXPath(node.parentNode));
          }
        } else {
          if (node.childNodes.length > 0) {
            for (let i = 0; i < node.childNodes.length; i++) {
              traverse(node.childNodes[i]);
            }
          } else {
            if (node.textContent.trim().length > 0) {
              nodeXPaths.push(getXPath(node));
            }
          }
        }
      }
    }
  
    traverse(container);
  
    return nodeXPaths;
}
    
    
var old_highlighted_texts = [];
var old_xpaths = [];

localStorage.setItem('text', JSON.stringify(old_highlighted_texts));
localStorage.setItem('xpaths', JSON.stringify(old_xpaths));


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
    let selectionRange = window.getSelection().getRangeAt(0);
    highlightedNodeText = [...highlightedText.split('\n\n')].filter(text => text.length != 1).map(text => text.trim());
    const xpaths = getXPathsForSelectedText();
    console.log("Xpaths below");
    console.log(xpaths);
    console.log('Highlighted node text below');
    console.log(highlightedNodeText);
    console.log('Highlighted text before processing below');
    console.log(highlightedText);
    console.log("++++++++++++++++++")
    console.log("-+-+-+-+-+-+-+-+--+")
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
          
          console.log("xxx")
          console.log(highlightedNodeText);
          console.log("xxxx")

        var highlightBox = highlightText(
            selectionRange,
            selectedOption,
            old_xpaths.length
        );
        document.body.appendChild(highlightBox);
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
