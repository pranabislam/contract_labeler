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

function highlightTextByXpath(xpath, textToHighlight, label, idx) {
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const selectedElement = result.singleNodeValue;
    
    // Get the text content of the selected element
    const elementText = selectedElement.textContent;
    
    // Find the start and end indices of the text to highlight
    const startIndex = elementText.indexOf(textToHighlight);
    const endIndex = startIndex + textToHighlight.length;
    
    // Create a range of the text to highlight
    const range = document.createRange();
    range.setStart(selectedElement.firstChild, startIndex);
    range.setEnd(selectedElement.firstChild, endIndex);
    
    // Get the position and dimensions of the selected element
    const rect = range.getBoundingClientRect();
    //const rect = selectedElement.getBoundingClientRect();
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
            const dialogBox = window.open("", "Delete Highlight Box", "height=200,width=400");
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.style.margin = '10px';
            deleteButton.addEventListener('click', () => {
                removeHighlightBox(highlightBox);
                dialogBox.close();
            });
            dialogBox.document.body.appendChild(deleteButton);
        }
    });

    // Add event listener to remove red border when de-selected
    document.addEventListener('click', (event) => {
        if (!highlightBox.contains(event.target)) {
        highlightBox.setAttribute('selected', 'false');
        highlightBox.style.border = 'none'; // Remove red border when de-selected
        }
    });
    return highlightBox
}
    
var xpath = '/html/body/document/type/sequence/filename/description/text/center[2]/div/p/b';
var textToHighlight = 'CONTENTS';

var highlightBox = highlightTextByXpath(xpath, textToHighlight, 'label100', 0);
document.body.appendChild(highlightBox);

xpath = '/html/body/document/type/sequence/filename/description/text/center[2]/div/p/b';
textToHighlight = 'TABLE';

highlightBox = highlightTextByXpath(xpath, textToHighlight, '99label99', 1);
document.body.appendChild(highlightBox);
