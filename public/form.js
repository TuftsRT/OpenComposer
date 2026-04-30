
// Adjust a textarea height based on the content.
ocForm.updateHeight = function(area) {
  area.style.height = 'auto';
  area.rows = area.value.split('\n').length;
};

// Return a valid suggestion items.
ocForm.validSuggestionItems = function(id) {
  const ulElement = document.getElementById("validSuggestions_" + id);
  return ulElement.querySelectorAll('li');
}

// Return an array of valid suggestion items.
ocForm.getValidSuggestions = function(id) {
  const ulElement = document.getElementById("validSuggestions_" + id);
  const listItems = ulElement.getElementsByTagName('li');
  return Array.from(listItems).map(li => li.textContent);
};

// Return a search input element.
ocForm.getSearchInput = function(id) {
  return document.getElementById(id);
};

// Return suggestions list element.
ocForm.getSuggestionsList = function(id) {
  return document.getElementById("suggestionsList_" + id);
};

// Return an add button element.
ocForm.getAddButton = function(id) {
  return document.getElementById("addButton_" + id);
};

// Return a selected items element.
ocForm.getSelectedItems = function(id) {
  return document.getElementById("selectedItems_" + id);
};

// Hide suggestions by clearing its content.
ocForm.hideSuggestions = function(id) {
  const suggestionsList = ocForm.getSuggestionsList(id);
  suggestionsList.innerHTML = '';
};

// Display suggestions based on the current search input.
ocForm.showSuggestions = function(id, showAll = false) {
  const searchInput = ocForm.getSearchInput(id);
  const suggestionsList = ocForm.getSuggestionsList(id);
  const validSuggestions = ocForm.getValidSuggestions(id);
  const query = searchInput.value.toLowerCase();
  suggestionsList.innerHTML = '';
  ocForm.updateAddButtonState(id, validSuggestions);

  let i = 0;
  validSuggestions.forEach((suggestion) => {
    if (showAll || suggestion.toLowerCase().includes(query)) {
      const li = document.createElement('li');
      li.classList.add('list-group-item', 'list-group-item-action', 'z-3');
      li.textContent = suggestion;

      if (Object.values(ocForm.multiSelectDisabledIndexes).includes(i++)) {
        li.style.pointerEvents = 'none';
        li.style.opacity = '0.5';
        li.style.background = "black";
        li.style.color = "white";
      }

      // Event listeners for click, mousedown, mouseover, and mouseout events.
      li.addEventListener('click', () => {
        searchInput.value = suggestion;
        suggestionsList.innerHTML = '';
        ocForm.updateAddButtonState(id, validSuggestions);
      });

      li.addEventListener('mousedown', () => {
        searchInput.value = suggestion;
        suggestionsList.innerHTML = '';
        ocForm.updateAddButtonState(id, validSuggestions);
      });

      li.addEventListener('mouseover', () => {
        ocForm.clearActiveItems(id);
        li.classList.add('active');
      });

      li.addEventListener('mouseout', () => {
        li.classList.remove('active');
      });

      suggestionsList.appendChild(li);
    }
  });
};

// Handle keyboard navigation and selection in the suggestions list.
ocForm.handleKeyDown = function(event, id) {
  const suggestionsList = ocForm.getSuggestionsList(id);
  const items = suggestionsList.getElementsByClassName('list-group-item');
  let currentIndex = -1;

  Array.from(items).some((item, index) => {
    if (item.classList.contains('active')) {
      currentIndex = index;
      return true; // escape loop
    }
  });

  if (['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) {
    event.preventDefault();
    
    if (event.key === 'ArrowDown' && currentIndex < items.length - 1) {
      currentIndex++;
      ocForm.updateActiveItem(items, currentIndex, id);
    }
    else if (event.key === 'ArrowUp' && currentIndex > 0) {
      currentIndex--;
      ocForm.updateActiveItem(items, currentIndex, id);
    }
    else if (event.key === 'Enter') {
      const input = ocForm.getSearchInput(id);
      if (input.value !== "") {
        ocForm.addSelectedItem(id);
      }
      if (currentIndex >= 0) {
	input.value = items[currentIndex].textContent;
      }
      suggestionsList.innerHTML = '';
    }
  }
};

// Update the active item in the suggestions list.
ocForm.updateActiveItem = function(items, currentIndex, id) {
  ocForm.clearActiveItems(id);
  if (currentIndex >= 0) {
    items[currentIndex].classList.add('active');
  }
};

// Clear active items in the suggestions list.
ocForm.clearActiveItems = function(id) {
  const items = ocForm.getSuggestionsList(id).getElementsByClassName('list-group-item');
  Array.from(items).forEach(item => item.classList.remove('active'));
};

// Enable or disable an add button based on the validity of the selected suggestion.
ocForm.updateAddButtonState = function(id, validSuggestions) {
  const searchInput = ocForm.getSearchInput(id).value;
  const addButton = ocForm.getAddButton(id);

  addButton.disabled = !validSuggestions.includes(searchInput);
};

// Update hidden values which are used in cache.
ocForm.updateHiddenValues = function(id) {
  const hiddenValues = document.getElementById("hiddenValues_" + id);
  const selectedItems = ocForm.getSelectedItems(id);
  const anchors = Array.from(selectedItems.getElementsByTagName('a'));

  hiddenValues.innerHTML = "";
  anchors.forEach((anchor, i) => {
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = `${id}_${i+1}`;
    hiddenInput.value = anchor.textContent;
    hiddenValues.appendChild(hiddenInput);
  });

  const lengthInput = document.createElement('input');
  lengthInput.type = 'hidden';
  lengthInput.name = `${id}_length`;
  lengthInput.value = anchors.length;
  hiddenValues.appendChild(lengthInput);
};

// Check a submission botton state
ocForm.checkSubmitState = function(id) {
  const searchInput = ocForm.getSearchInput(id);
  const submitBotton = document.getElementById("_submitButton");
  
  if (searchInput.dataset.required === "false") {
    submitBotton.disabled = false;
  }
  else{
    const selectedItems = ocForm.getSelectedItems(id);
    const anchors = Array.from(selectedItems.getElementsByTagName('a'));
    submitBotton.disabled = (anchors.length === 0);
  }
}

// Add a selected item to the display inputs.
ocForm.addSelectedItem = function(id) {
  const searchInput = ocForm.getSearchInput(id);
  const selectedItems = ocForm.getSelectedItems(id);
  const validSuggestions = ocForm.getValidSuggestions(id);
  const selectedText = searchInput.value;
  const scriptOverwriteFlag = searchInput.dataset.scriptFlag === "true";
  const submitOverwriteFlag = searchInput.dataset.submitFlag === "true";

  const addBadge = () => {
    const badge = document.createElement('a');
    badge.href = "#";
    let bgColor, textColor;
    if (scriptOverwriteFlag) {
      bgColor = 'bg-primary';
      textColor = 'text-color';
    }
    else if (submitOverwriteFlag) {
      bgColor = 'bg-danger-subtle';
      textColor = 'text-dark';
    }
    else {
      bgColor = 'bg-warning';
      textColor = 'text-dark';
    }
    badge.classList.add('badge', 'rounded-pill', bgColor, textColor, 'p-2', 'text-decoration-none');

    badge.textContent = selectedText;

    const validSuggestionItems = ocForm.validSuggestionItems(id);

    Array.from(validSuggestionItems).some(li => {
      if (li.textContent.trim() === selectedText) {
        badge.setAttribute('data-value', li.getAttribute('data-value'));
        return true; // Escape loop
      }
    });

    badge.addEventListener('click', (event) => {
      event.preventDefault();
      const removeBadge = (contentType) => {
        selectedItems.removeChild(badge);
        ocForm.updateHiddenValues(id);
        ocForm.checkSubmitState(id);
        ocForm.updateArea(contentType, id);
      };

      if (!scriptOverwriteFlag && !submitOverwriteFlag) {
        removeBadge();
      }
      else {
        if (scriptOverwriteFlag) {
          ocForm.confirmOverwrite('script', id,  () => removeBadge('script'));
        }
        else { // submitOverwriteFlag === true
          ocForm.confirmOverwrite('submit', id,  () => removeBadge('submit'));
        }
      }
    });

    selectedItems.appendChild(badge);
    ocForm.updateHiddenValues(id);
    ocForm.checkSubmitState(id);
    searchInput.value = '';
    ocForm.updateAddButtonState(id, validSuggestions);
    if (scriptOverwriteFlag) ocForm.updateArea('script', id);
    if (submitOverwriteFlag) ocForm.updateArea('submit', id);
  };

  if (selectedText && validSuggestions.includes(selectedText)) {
    const runAddBadge = () => addBadge();
    
    if (!scriptOverwriteFlag && !submitOverwriteFlag) {
      runAddBadge();
    }
    else if (scriptOverwriteFlag) {
      ocForm.confirmOverwrite('script', id, runAddBadge);
    }
    else {
      ocForm.confirmOverwrite('submit', id, runAddBadge);
    }
  }
};

// Load files and updates the file selector interface dynamically.
ocForm.loadFiles = function(scriptName, currentPath, key, showFiles, homeDir, isFromButton) {
  const selectedPath = document.getElementById("oc-modal-data-" + key);
  if (isFromButton) {
    currentPath = selectedPath.dataset.path;
  }

  const parts = currentPath.split('/');
  let subPath = "";
  const linkedParts = parts.map(part => {
    if (part) {
      subPath += "/" + part;
      return ` <a href="#" onclick="ocForm.loadFiles('${scriptName}', '${subPath}', '${key}', ${showFiles}, '${homeDir}', false)">${part}</a> `;
    }
    else {
      return ''; // Avoid empty string for root directory
    }
  });
  
  const files_or_directory = scriptName + "/_file_or_directory";
  fetch(`${files_or_directory}?path=${encodeURIComponent(currentPath)}`)
    .then(response => response.json())
    .then(data => {
      selectedPath.dataset.path = currentPath;
      selectedPath.innerHTML = `<a href='#' onclick="ocForm.loadFiles('${scriptName}', '${homeDir}', '${key}', ${showFiles}, '${homeDir}', false)">&#x1f3e0;</a> `;
      const parentPath = currentPath.replace(/\/+$/, '').split('/').slice(0, -1).join('/') || '/';
      selectedPath.innerHTML += `<a href='#' onclick="ocForm.loadFiles('${scriptName}', '${parentPath}', '${key}', ${showFiles}, '${homeDir}', false)" style="text-decoration:none;">&#x2B06;&#xFE0F;</a> `;
      selectedPath.innerHTML += linkedParts.join('/');

      if (data.type === 'directory' && !selectedPath.dataset.path.endsWith("/")) {
        selectedPath.dataset.path += "/";
        selectedPath.innerHTML += "/";
      }
    });
  
  const checkbox = document.getElementById("oc-modal-checkbox-" + key);
  const filespath = scriptName + "/_files";
  fetch(`${filespath}?path=${encodeURIComponent(currentPath)}`)
    .then(response => response.json())
    .then(data => {
      const tbody = document.getElementById('oc-modal-tbody-' + key);
      tbody.innerHTML = '';
      if(!data.files){ return; }

      data.files.forEach(file => {
        if (file.type === 'file' && !showFiles) {
          return;
        }
        const row = document.createElement('tr');
        const typeCell = document.createElement('td');
        typeCell.innerHTML = file.type === 'file' ? '&#x1f4c4;' : '&#x1F4C1;';
        typeCell.className = 'text-center';
        
        const pathCell = document.createElement('td');
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = file.name;
        link.dataset.path = file.path;
        
        link.onclick = function(e) {
          e.preventDefault();
          ocForm.loadFiles(scriptName, file.path, key, showFiles, homeDir, false);
        };

        pathCell.appendChild(link);
        row.appendChild(typeCell);
        row.appendChild(pathCell);

        if (file.name.startsWith(".") && checkbox.checked) {
          row.style.display = "none";
        }

        tbody.appendChild(row);
      });
    });
};

// Hide or show hidden files based on the checkbox state.
ocForm.hideHidden = function(key) {
  const checkbox = document.getElementById("oc-modal-checkbox-" + key);
  const tbody = document.getElementById("oc-modal-tbody-" + key);
  const rows = Array.from(tbody.getElementsByTagName("tr"));

  rows.forEach(row => {
    const cell = row.getElementsByTagName("td")[1];
    const name = cell.textContent || cell.innerText;

    if (name.startsWith(".")) {
      row.style.display = checkbox.checked ? "none" : "";
    }
  });
};

// Handle the click event on table rows to navigate between directories.
ocForm.handleRowClick = function(event, key, showFiles, scriptName, homeDir) {
  let target = event.target;
  while (target && target.nodeName !== "TR") {
    target = target.parentNode;
  }

  if (target && target.nodeName === "TR") {
    const t = target.querySelector('td:nth-child(2) a');
    ocForm.loadFiles(scriptName, t.dataset.path, key, showFiles, homeDir, false);
  }
};

// Sort the table rows based on the selected column and direction.
ocForm.sortTable = function(key, columnIndex, direction) {
  const tbody = document.getElementById("oc-modal-tbody-" + key);
  const rows = Array.from(tbody.rows);

  rows.sort((a, b) => {
    const x = a.getElementsByTagName("TD")[columnIndex].innerHTML.toLowerCase();
    const y = b.getElementsByTagName("TD")[columnIndex].innerHTML.toLowerCase();

    return direction === "asc" ? (x > y ? 1 : -1) : (x < y ? 1 : -1);
  });

  rows.forEach(row => tbody.appendChild(row));
};

// Toggle the sort direction for a column and sorts the table.
ocForm.toggleSort = function(key, columnIndex) {
  const button = document.getElementById(`oc-modal-button-${key}-${columnIndex}`);
  const direction = button.getAttribute('data-direction');

  ocForm.sortTable(key, columnIndex, direction);
  if (direction === 'asc') {
    button.innerHTML = '&#9650;';
    button.setAttribute('data-direction', 'desc');
  }
  else {
    button.innerHTML = '&#9660;';
    button.setAttribute('data-direction', 'asc');
  }
};

// Filter table rows based on the input value and hides hidden files.
ocForm.filterRows = function(key) {
  const input = document.getElementById("oc-modal-filter-" + key).value.toLowerCase();
  const tbody = document.getElementById("oc-modal-tbody-" + key);
  const rows = Array.from(tbody.getElementsByTagName("tr"));

  rows.forEach(row => {
    const cell = row.getElementsByTagName("td")[1];
    const name = cell.innerText;
    row.style.display = name.toLowerCase().includes(input) ? "" : "none";
  });

  ocForm.hideHidden(key);
};

// Check if an element is selected (e.g., a checkbox or radio button).
ocForm.isElementChecked = function(id) {
  const element = document.getElementById(id);
  if(element.disabled) return false;

  if (element.tagName === "OPTION") {
    return element.selected;
  }
  else if (element.tagName === "INPUT") {
    return element.checked;
  }
  else {
    console.error("Unknown Tag");
  }
};

// Get a parent div.
ocForm.getParentDiv = function(key, widget, size) {
  switch (widget) {
  case 'number':
  case 'text':
  case 'email':
    if (size > 1) { key = key + "_1"; }
    break;
  case 'radio':
  case 'checkbox':
    key = key + "_1";
    break;
  }

  return document.getElementById(key).closest('.mb-3');
}

// Show a widget.
ocForm.showWidget = function(key, widget, size) {
  if (key === "_script_content") {
    document.getElementById(key).style.display = 'block';
    document.getElementById("label_" + key).style.display = 'block';
    document.getElementById('_form_layout').classList.add('row-cols-lg-2');
    document.getElementById("_form_container").style.removeProperty("max-width");
  }
  else {
    const parent = ocForm.getParentDiv(key, widget, size);
    if (parent) {
      parent.style.display = 'block';
    }
  }
};

// Hide a widget.
ocForm.hideWidget = function(key, widget, size) {
  if (key === "_script_content") {
    document.getElementById(key).style.display = 'none';
    document.getElementById("label_" + key).style.display = 'none';
    document.getElementById('_form_layout').classList.remove('row-cols-lg-2');
    document.getElementById("_form_container").style.maxWidth = '960px';
  }
  else {
    const parent = ocForm.getParentDiv(key, widget, size);
    if (parent) {
      parent.style.display = 'none';
    }
  }
};

// Split the string into a key and a number.
ocForm.splitKeyAndNumber = function(str) {
  const match = str.match(/^(.+?)_(\d+)$/);
  if (match) {
    const baseKey = match[1];
    const number  = match[2];
    return { baseKey, number };
  }
  else{
    const baseKey = str;
    const number  = null;
    return { baseKey, number };
  }
}

// Return a value of a form element based on its widget type.
ocForm.getValue = function(key, widget) {
  let e = null;
  switch (widget) {
  case 'number':
  case 'text':
  case 'email':
    e = document.getElementById(key);
    if(e && !e.disabled) return e.value;
    break;
  case 'select':
    const sKey = ocForm.splitKeyAndNumber(key);
    e = document.getElementById(sKey.baseKey);
    if (e && !e.disabled && "selectedIndex" in e && e.selectedIndex !== -1) {
      const sValue = e.options[e.selectedIndex].dataset.value;
      try {
	return (sKey.number !== null) ? JSON.parse(sValue)[Number(sKey.number)-1] : sValue;
      }
      catch {
	// If JSON.parse throws an error.
	// For example, if the key is "hoge_1" but multiple items are not defined.
	return sValue;
      }
    }
    break;
  case 'multi_select':
    const mKey = ocForm.splitKeyAndNumber(key);
    const items = ocForm.getSelectedItems(mKey.baseKey);
    if(!items.disabled && !document.getElementById(mKey.baseKey).disabled){
      const aTags = items.getElementsByTagName('a');
      if (aTags) {
	return Array.from(aTags).map(a => {
	  if (ocForm.multiSelectDisabledIndexes[a.textContent] !== undefined){
	    return null;
	  }
	  else {
	    const mValue = a.getAttribute('data-value');
	    try {
	      return (mKey.number !== null) ? JSON.parse(mValue)[Number(mKey.number)-1] : mValue;
	    }
	    catch {
	      return mValue;
	    }
	  }
	}).filter(value => value !== null);
      }
    }
    break;
  case 'radio':
    const rKey = ocForm.splitKeyAndNumber(key);
    for (const e of document.getElementsByName(rKey.baseKey)) {
      if (e.checked && !e.disabled) {
	const rValue = e.dataset.value;
	try {
          return (rKey.number !== null) ? JSON.parse(rValue)[Number(rKey.number)-1] : rValue;
	}
	catch {
	  return rValue;
	}
      }
    }
    break;
  case 'checkbox':
    const cKey = ocForm.splitKeyAndNumber(key);
    const checkboxDiv = document.getElementById(cKey.baseKey + '_1').closest('div');
    const divs = checkboxDiv.parentElement.querySelectorAll('div');
    let value = [];
    divs.forEach(div => {
      const checkbox = div.querySelector('input[type="checkbox"]');
      if (checkbox !== null && checkbox.checked && !checkbox.disabled) {
        const cValue = checkbox.dataset.value;
	try {
	  if (cKey.number !== null) {
            value.push(JSON.parse(cValue)[cKey.number-1]);
	  }
	  else {
            value.push(cValue);
	  }
	}
	catch {
	  value.push(cValue);
	}
      }
    });
    return value;
  case 'path':
    if (!document.getElementById(key).disabled) {
      return document.getElementById(key).value;
    }
    break;
  }
  
  return null;
}

// Return a directory name.
ocForm.dirname = function(path) {
  if (path == null) return "";

  path = String(path);
  if (path === "") return ".";　// If path is empty, return "."

  // Remove trailing slashes (except when the entire path is just "/")
  path = path.replace(/\/+$/, "");
  
  // Find the last "/"
  const index = path.lastIndexOf("/");

  // If no "/" exists, return "."
  if (index === -1) return ".";

  // If the result is empty (e.g. "/foo" → ""), return "/"
  const dir = path.slice(0, index);
  return dir === "" ? "/" : dir;
}

// Return a base name.
ocForm.basename = function(path) {
  if (path == null) return "";

  path = String(path);

  // Remove trailing slashes (e.g. "/foo/bar///" → "/foo/bar")
  path = path.replace(/\/+$/, "");

  // Find the last "/" and return the substring after it
  const index = path.lastIndexOf("/");

  // If no "/" exists, return the whole string
  if (index === -1) return path;

  return path.slice(index + 1);
}

// Return value with zero padding
ocForm.zeroPadding = function(num, length) {
  return num === "" ? "" : String(num).padStart(length, '0');
}

// Evaluate calc(...) expression
function safeEval(expr) {
  if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
    throw new Error("Invalid character is included.");
  }
  return Function(`return (${expr})`)();
}

function evalCalc(expr) {
  try {
    const parts = expr.split(",").map(s => s.trim()); // e.g. ["1 + (2 * 3)", "3", OC_ROUNDING_FLOOR]
    const valueExpr = parts[0] ?? "";
    if (valueExpr === "") return "";
    const value = safeEval(valueExpr); // 7
    const decimals = Number(parts[1]); // 3
    const rounding = parts[2];         // OC_ROUNDING_FLOOR

    // Check values
    if (!Number.isFinite(value)) throw new Error("Expression did not evaluate to a finite number.");
    if (!Number.isInteger(decimals) || decimals < 0) throw new Error("decimalPlaces must be a non-negative integer.");

    const factor = 10 ** decimals;
    const n = value * factor;  // Helper: avoid floating error a bit

    let rounded;
    if (rounding === "OC_ROUNDING_ROUND") {
      rounded = (n >= 0 ? Math.floor(n + 0.5) : Math.ceil(n - 0.5)) / factor;
    } else if (rounding === "OC_ROUNDING_FLOOR") {
      rounded = Math.floor(n) / factor;
    } else if (rounding === "OC_ROUNDING_CEIL") {
      rounded = Math.ceil(n) / factor;
    } else {
      throw new Error(`Unknown roundingMode: ${rounding}`);
    }

    return rounded.toFixed(decimals);
  } catch (e) {
    console.error(e.message);
    return "";
  }
}

// Output lines in the script contents.
ocForm.showLine = function(selectedValues, line, keys, widgets, canHide, separators) {
  // Check if line should be made visible
  for (const k in keys) {
    const value = ocForm.getValue(keys[k], widgets[k]);
    if ((value === null || value === "") && canHide[k] === false) return;
  }

  for (const k in keys) {
    let value = ocForm.getValue(keys[k], widgets[k]);
    value = typeof value === "number" ? String(value) : value;
    if (value != null && !Array.isArray(value)) { // If nothing is checked in the checkbox, value = [].
      const escapeSequences = {
	"\\n": "\n",
	"\\t": "\t",
	"\\r": "\r",
	"\\\\": "\\",
	"\\\"": "\"",
	"\\'": "'"
      };
      value = value.replace(/\\[ntr\\'"]/g, match => escapeSequences[match]);
    }

    if (value === null && canHide[k] === true) {
      value = ""
    }
    
    if (value !== null) {
      if (canHide[k] === true) {
        keys[k] = ":" + keys[k];
      }

      switch (widgets[k]) {
      case "checkbox":
      case "multi_select":
        if (separators[k] !== null){
          let tmp_value = "";
          for (let i = 0; i < value.length; i++) {
            tmp_value += value[i];
            tmp_value += (i !== value.length - 1) ? separators[k] : "";
          }
          line = (tmp_value) ? line.replace("#{" + keys[k] + "}", tmp_value) : "";
        }
        else {
          let tmp_line = "";
          for (let i = 0; i < value.length; i++) {
            tmp_line += line.replace("#{" + keys[k] + "}", value[i]);
            tmp_line += (i !== value.length - 1) ? "\n" : "";
          }
          line = tmp_line;
        }
        break;
      case "number":
      case "text":
      case "email":
      case "select":
      case "radio":
      case "path":
        line = line.replace(new RegExp(`#{${keys[k]}}`, "g"), value);
        break;
      }
    }
  }

  // After variable substitution, replace the #{zeropadding(..)} section with the calculated result.
  line = line.replace(/#\{zeropadding\(([^}]*)\)\}/g, (_, expr) => {
    const idx   = expr.lastIndexOf(",");      // "10, 3", "calc(2 * 3), 3" or "calc(2 * 3, 4), 3"
    let value   = expr.slice(0, idx).trim();  // "10", "calc(2 * 3)", "calc(2 * 3, 4)"
    const width = expr.slice(idx + 1).trim(); // "3"

    // If the first argument is calc(...), evaluate it using the same logic as #{calc(...)}
    const m = value.match(/^calc\((.*)\)$/);
    if (m) { // m[1] is the inner expression, e.g. "2 * 3"
      value = evalCalc(m[1]);
    }

    return ocForm.zeroPadding(value, width);
  });

  // After variable substitution, replace the #{calc(..)} section with the calculated result.
  line = line.replace(/#\{calc\(([^}]*)\)\}/g, (_, expr) => {
    return evalCalc(expr);
  });

  // After variable substitution, replace the #{dirname(..)} section with the calculated result.
  line = line.replace(/#\{dirname\((.*?)\)\}/g, (match, inner) => {
    return ocForm.dirname(inner);
  });

  // After variable substitution, replace the #{basename(..)} section with the calculated result.
  line = line.replace(/#\{basename\((.*?)\)\}/g, (match, inner) => {
    return ocForm.basename(inner);
  });
    
  if (line) {
    selectedValues.push(line);
  }
}

// Enable a widget.
ocForm.enableWidget = function(key, num, widget, size) {
  if (num !== null) {
    if (widget === "multi_select") {
      ocForm.multiSelectDisabledIndexes = {};
      // By assigning an empty object, all properties are removed.
      // This is fast, but may use a lot of memory since the original object is not deleted.
    }
    else {
      document.getElementById(key + "_" + num).disabled = false;
    }
  }
  else {
    switch (widget) {
    case 'number':
    case 'text':
    case 'email':
      if (size === null) {
        document.getElementById(key).disabled = false;
      }
      else {
        for (let i = 1; i <= size; i++) {
          document.getElementById(key + "_" + i).disabled = false;
        }
      }
      break;
    case 'checkbox':
    case 'radio':
      for (let i = 1; i <= size; i++) {
        document.getElementById(key + "_" + i).disabled = false;
      }
      break;
    case 'select':
    case 'multi_select':
    case 'path':
      document.getElementById(key).disabled = false;
      break;
    }
  }
};

// Disable a widget.
ocForm.disableWidget = function(key, num, widget, value, size) {
  if (num !== null) {
    if (widget === "multi_select") {
      ocForm.multiSelectDisabledIndexes[value] = num - 1;
    }
    else {
      document.getElementById(key + "_" + num).disabled = true;
      
      if (widget === 'select' && document.getElementById(key).selectedIndex === num - 1) {
	const selectBox = document.getElementById(key);

	// Find the next valid option
        const nextValidOption = Array.from(selectBox.options).find(option => !option.disabled)
	if (nextValidOption) {
	  selectBox.value = nextValidOption.value;
	}
	else {
	  selectBox.selectedIndex = -1;
	}
      }
      else if (widget === 'radio' && document.getElementsByName(key)[num - 1].checked) {
        document.getElementsByName(key)[num - 1].checked = false;
      }
    }
  }
  else {
    switch (widget) {
    case 'number':
    case 'text':
    case 'email':
      if (size === null) {
        document.getElementById(key).disabled = true;
      }
      else {
        for (let i = 1; i <= size; i++) {
          document.getElementById(key + "_" + i).disabled = true;
        }
      }
      break;
    case 'checkbox':
    case 'radio':
      for (let i = 1; i <= size; i++) {
        document.getElementById(key + "_" + i).disabled = true;
      }
      break;
    case 'select':
    case 'multi_select':
    case 'path':
      document.getElementById(key).disabled = true;
      break;
    }
  }
};

// Set a form element's attributes for initialization.
ocForm.setInitValue = function(key, num, widget, attr, value, fromId) {
  const id = num ? key + "_" + num : key;
  if ((attr === "min" || attr === "max" || attr === "step") && widget === "number") {
    document.getElementById(id).setAttribute(attr, value);
  }
  else if (attr === "label" || attr == "help") {
    const text = document.getElementById(attr + "_" + id);
    if (text !== null) {
      text.innerHTML = value;
      text.style.display = value !== "" ? "block" : "none";
    }
  }
  else if (attr === "required") {
    const label = document.getElementById("label_" + id);
    if (label !== null) {
      label.textContent = label.getAttribute('data-label');
      label.style.display = label.textContent !== "" ? "block" : "none";
      const required = label.getAttribute('data-required');
      let input;
      switch (widget) {
      case "radio":
	input = document.getElementById(id + "_1");
	break;
      case "checkbox":
	input = num == "" ? document.getElementById("label_" + id) : document.getElementById(id);
	break;
      default:
	input = document.getElementById(id);
      }

      if (required !== null && input !== null) {
	switch (widget) {
	case "checkbox":
	  if (num === "") {
	    input.setAttribute("data-required", value === "true");
	    ocForm.validateCheckboxForSubmit(id);
	  }
	  else {
	    if (value === "true") {
	      input.setAttribute('required', '');
	    }
	    else {
	      input.removeAttribute('required');
	    }
	  }
	  break;
	case "multi_select":
	  const submitBotton = document.getElementById("_submitButton");
	  if (value === "true") {
	    const selectedItems = ocForm.getSelectedItems(id);
	    const anchors = Array.from(selectedItems.getElementsByTagName('a'));
	    submitBotton.disabled = anchors.length === 0;
	  }
	  else {
	    const searchInput = ocForm.getSearchInput(id);
	    submitBotton.disabled = false;
	  }
	  break;
	default:
	  if (value === "true") {
	    input.setAttribute('required', '');
	  }
	  else {
	    input.removeAttribute('required');
	  }
	}
      }
    }
  }
  else if (attr === "value") {
    switch(widget){
    case 'number':
    case 'text':
    case 'email':
      if (id !== fromId) {
        document.getElementById(id).value = value;
      }
      break;
    case 'select':
      if (key !== fromId) {
        const selectBox = document.getElementById(key);
        const options = Array.from(selectBox.querySelectorAll('option'));

        for (let i = 0; i < options.length; i++) {
          document.getElementById(key + "_" + (i+1)).disabled = false;
        }
      }
      break;
    case 'multi_select':
    case 'checkbox':
      break;
    case 'radio':
      const parentDiv = document.getElementById(key + '_1').closest('div');
      const divs = parentDiv.parentElement.querySelectorAll('div');

      divs.forEach(div => {
	const input = div.querySelector(`input[type="${widget}"]`);
	if (input !== null) {
  	  input.disabled = false;
	}
      });
      break;
    case 'path':
      if(key !== fromId){
        document.getElementById("oc-modal-data-" + key).dataset.path = value;
        document.getElementById(key).value = value;
      }
      break;
    } // end widget
  } // end if (attr === "value")
};

// Set a form element's attributes.
ocForm.setValue = function(key, num, widget, attr, value, fromId) {
  const id = num ? key + "_" + num : key;
  if ((attr === "min" || attr === "max" || attr === "step") && widget === "number") {
    ocForm.setInitValue(key, num, widget, attr, value, fromId);
  }
  else if (attr === "label" || attr === "help"){
    ocForm.setInitValue(key, num, widget, attr, value, fromId);
  }
  else if (attr === "required") {
    const label = document.getElementById("label_" + id);

    if (label !== null) {
      label.textContent = label.textContent.trim();
      label.style.display = label.textContent !== "" ? "block" : "none";
      const required = label.getAttribute('data-required');
      let input;
      switch (widget) {
      case "radio":
	input = document.getElementById(id + "_1");
	break;
      case "checkbox":
	input = num == "" ? document.getElementById("label_" + id) : document.getElementById(id);
	break;
      default:
	input = document.getElementById(id);
      }

      if (required !== null && input !== null) {
	switch (widget) {
	case "checkbox":
	  if (num === "") {
	    input.setAttribute("data-required", value === "true");
	    ocForm.validateCheckboxForSubmit(id);
	  }
	  else {
	    if (value === "true") {
	      input.setAttribute('required', '');
	    }
	    else {
	      input.removeAttribute('required');
	    }
	  }
	  break;
	case "multi_select":
	  const submitBotton = document.getElementById("_submitButton");
          if (value === "true") {
            const selectedItems = ocForm.getSelectedItems(id);
            const anchors = Array.from(selectedItems.getElementsByTagName('a'));
            submitBotton.disabled = anchors.length === 0;
          }
          else {
            const searchInput = ocForm.getSearchInput(id);
            submitBotton.disabled = false;
          }
	  break;
	default:
	  if (value === "true") {
	    input.setAttribute('required', '');
	  }
	  else {
	    input.removeAttribute('required');
	  }
	}
      }
      
      if (required !== null) {
	if (value === "true" && required !== "true") {
	  label.textContent = label.textContent.trim() + "*";
	  label.style.display = "block";
	}
	else if (value === "false" && required === "true") {
	  label.textContent = label.textContent.trim().slice(0, -1); // Delete only the last character (*).
	  label.style.display = label.textContent !== "" ? "block" : "none";
	}
      }
    }
  }
  else if (attr === "value") {
    switch(widget){
    case 'number':
    case 'text':
    case 'email':
    case 'path':
      ocForm.setInitValue(key, num, widget, attr, value, fromId);
      break;
    case 'select':
      if (key !== fromId) {
        const selectBox = document.getElementById(key);
        const options = Array.from(selectBox.querySelectorAll('option'));

        for (let i = 0; i < options.length; i++) {
          if (options[i].textContent === value) {
            document.getElementById(key).selectedIndex = i;
          }
        }
      }
      break;
    case 'multi_select':
      if (key !== fromId) {
        ocForm.getSearchInput(key).value = value;
        ocForm.addSelectedItem(key);
      }
      break;
    case 'radio':
    case 'checkbox':
      if (typeof fromId === 'undefined' || key !== fromId.replace(/_\d+$/, "")) { // hoge_2 -> hoge
	const parentDiv = document.getElementById(key + '_1').closest('div');
	const divs = parentDiv.parentElement.querySelectorAll('div');
	divs.forEach(div => {
	  const input = div.querySelector(`input[type="${widget}"]`);
	  if (input !== null) {
            const label = div.querySelector(`label[for="${input.id}"]`);
            if (label.textContent === value) {
              input.checked = true;
            }
	  }
	});
      }
      break;
    } // end widget
  } // end if (attr === "value")
};

// Update the selected path in the file input.
ocForm.updatePath = function(key) {
  document.getElementById(key).value = document.getElementById("oc-modal-data-" + key).dataset.path;
};

// If a checkbox widget has `required: true` attribute and none are checked,
// disable the submit button. If any are checked, enable the submit button.
ocForm.validateCheckboxForSubmit = function(key) {
  const checkboxLabel = document.getElementById("label_" + key);
  if(checkboxLabel.getAttribute("data-required") === "false") {
    document.getElementById("_submitButton").disabled = false;
    return;
  }
  else{
    const checkboxDiv = document.getElementById(key + "_1").closest('div');
    const divs = checkboxDiv.parentElement.querySelectorAll('div');
    const isChecked = Array.from(divs).some(div => {
      const checkbox = div.querySelector('input[type="checkbox"]');
      return checkbox !== null && checkbox.checked && !checkbox.disabled;
    });
    document.getElementById("_submitButton").disabled = !isChecked;
  }
};

// Show "Submitting..." on the button and disable it to prevent double submission.
// The form is submitted normally and the button resets after page reload. 
ocForm.submitEffect = function(action) {
  const btn = document.getElementById('_submitButton');
  btn.disabled = true;
  if (action === "submit") {
    btn.value = 'Submitting...';
  }
  else if (action === "save") {
    btn.value = 'Saving...';
  }
  // Note that confirm is not needed.
    
  btn.classList.remove('btn-primary');
  btn.classList.add('btn-warning');

  return true;
};

// =============================================================================
// Dynamic SLURM Resource Discovery — 2D partition+GPU lookups
// Auto-activated only when data-* attributes are present on the partition select.
// =============================================================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('[OC-SLURM] DOMContentLoaded fired — checking for dynamic data attributes...');

  const partitionSelect = document.getElementById('partition');
  if (!partitionSelect) {
    console.log('[OC-SLURM] No #partition element found — skipping dynamic discovery.');
    return;
  }

  // Check if dynamic data attributes are present
  const gpuOptionsJson  = partitionSelect.getAttribute('data-partition-gpu-options');
  const coresJson       = partitionSelect.getAttribute('data-partition-gpu-max-cores');
  const memoryJson      = partitionSelect.getAttribute('data-partition-gpu-max-memory');
  const hoursJson       = partitionSelect.getAttribute('data-partition-max-hours');
  const unavailJson     = partitionSelect.getAttribute('data-unavailable-gpus');
  const gresMapJson     = partitionSelect.getAttribute('data-gres-map');
  const gpuMaxJson      = partitionSelect.getAttribute('data-partition-gpu-max-gpus');

  console.log('[OC-SLURM] data-partition-gpu-options present:', !!gpuOptionsJson);
  console.log('[OC-SLURM] data-partition-gpu-max-cores present:', !!coresJson);
  console.log('[OC-SLURM] data-partition-gpu-max-memory present:', !!memoryJson);
  console.log('[OC-SLURM] data-partition-max-hours present:', !!hoursJson);
  console.log('[OC-SLURM] data-unavailable-gpus present:', !!unavailJson);
  console.log('[OC-SLURM] data-gres-map present:', !!gresMapJson);
  console.log('[OC-SLURM] data-partition-gpu-max-gpus present:', !!gpuMaxJson);

  // Check if this is a CPU form with dynamic SLURM discovery
  const slurmDiscovery = partitionSelect.getAttribute('data-slurm-discovery');
  if (slurmDiscovery === 'cpu') {
    console.log('[OC-SLURM] CPU form — dynamic SLURM discovery active (resource limits via set-max-* directives).');
    return;
  }

  // Only activate GPU 2D JS if we have GPU data attributes
  if (!gpuOptionsJson) {
    console.log('[OC-SLURM] No dynamic data attributes found — using static fallback defaults.');
    return;
  }

  let gpuOptionsMap, coresMap, memoryMap, hoursMap, unavailMap, gresMap, gpuMaxMap;
  try {
    gpuOptionsMap = JSON.parse(gpuOptionsJson);
    coresMap      = coresJson ? JSON.parse(coresJson) : {};
    memoryMap     = memoryJson ? JSON.parse(memoryJson) : {};
    hoursMap      = hoursJson ? JSON.parse(hoursJson) : {};
    unavailMap    = unavailJson ? JSON.parse(unavailJson) : {};
    gresMap       = gresMapJson ? JSON.parse(gresMapJson) : {};
    gpuMaxMap     = gpuMaxJson ? JSON.parse(gpuMaxJson) : {};
    console.log('[OC-SLURM] Parsed all JSON data successfully.');
  } catch (e) {
    console.error('[OC-SLURM] Failed to parse SLURM discovery data:', e);
    return;
  }

  console.log('[OC-SLURM] gpuOptionsMap partitions:', Object.keys(gpuOptionsMap));
  console.log('[OC-SLURM] gpuOptionsMap:', gpuOptionsMap);
  console.log('[OC-SLURM] coresMap:', coresMap);
  console.log('[OC-SLURM] memoryMap (GB):', memoryMap);
  console.log('[OC-SLURM] hoursMap:', hoursMap);
  console.log('[OC-SLURM] unavailMap:', unavailMap);
  console.log('[OC-SLURM] gresMap:', gresMap);
  console.log('[OC-SLURM] gpuMaxMap:', gpuMaxMap);

  const gpuTypeSelect  = document.getElementById('gpu_type');
  const coresInput     = document.getElementById('cores_memory_1');
  const memoryInput    = document.getElementById('cores_memory_2');
  const timeInput      = document.getElementById('time_1');

  console.log('[OC-SLURM] DOM elements found — gpu_type:', !!gpuTypeSelect,
    'cores_memory_1:', !!coresInput, 'cores_memory_2:', !!memoryInput, 'time_1:', !!timeInput);

  // Repopulate GPU type options based on selected partition
  ocForm.repopulateGpuTypes = function() {
    if (!gpuTypeSelect) return;

    const partition = partitionSelect.value;
    const opts = gpuOptionsMap[partition] || gpuOptionsMap['all'] || [];

    console.log('[OC-SLURM] repopulateGpuTypes() — partition:', partition,
      '| GPU options for this partition:', opts.map(o => o[1]));

    // Remember current selection
    const currentValue = gpuTypeSelect.value;
    const currentDataValue = gpuTypeSelect.options[gpuTypeSelect.selectedIndex]?.getAttribute('data-gpu-id');
    console.log('[OC-SLURM]   previous gpu_type selection:', currentValue, '(gpu-id:', currentDataValue + ')');

    // Clear existing options
    gpuTypeSelect.innerHTML = '';

    opts.forEach(function(opt, i) {
      const label = opt[0];
      const gpuId = opt[1]; // raw Slurm GPU id/feature like 'a100-80G', 'h200', etc.
      const gresInfo = gresMap[gpuId] || [gpuId, '']; // [slurm_gres_name, constraint]
      // Append ':' to non-empty gres names so script template produces correct format:
      // "a100:" + "1" → "gpu:a100:1" | "" + "1" → "gpu:1" (any)
      const gresForScript = gresInfo[0] ? gresInfo[0] + ':' : '';
      const option = document.createElement('option');
      option.id = 'gpu_type_' + (i + 1);
      option.value = label;
      // data-value is a JSON array for script substitution:
      // #{:gpu_type_1}=gres_name_with_colon, #{gpu_type_2}=optional full constraint line
      const constraintLine = gresInfo[1] ? '#SBATCH --constraint=' + gresInfo[1] : '';
      option.setAttribute('data-value', JSON.stringify([gresForScript, constraintLine]));
      // data-gpu-id is the internal identifier for 2D resource lookups
      option.setAttribute('data-gpu-id', gpuId);
      option.textContent = label;
      gpuTypeSelect.appendChild(option);
      console.log('[OC-SLURM]   option:', label, '| gpu-id:', gpuId, '| gres-for-script:', JSON.stringify([gresForScript, gresInfo[1]]));
    });

    // Try to restore previous selection by gpu-id
    let restored = false;
    for (let i = 0; i < gpuTypeSelect.options.length; i++) {
      if (gpuTypeSelect.options[i].getAttribute('data-gpu-id') === currentDataValue ||
          gpuTypeSelect.options[i].value === currentValue) {
        gpuTypeSelect.selectedIndex = i;
        restored = true;
        break;
      }
    }
    if (!restored && gpuTypeSelect.options.length > 0) {
      gpuTypeSelect.selectedIndex = 0;
    }

    const finalSelection = gpuTypeSelect.options[gpuTypeSelect.selectedIndex];
    console.log('[OC-SLURM]   restored previous selection:', restored,
      '| final selection:', finalSelection?.value, '(data-value:', finalSelection?.getAttribute('data-value') + ')');

    // Show/hide GPU-related fields based on whether partition has GPUs
    const gpuContainer = gpuTypeSelect.closest('.mb-3');
    const gpusInput = document.getElementById('gpus');
    const gpusContainer = gpusInput ? gpusInput.closest('.mb-3') : null;
    const hasGpus = opts.length > 0 && !(opts.length === 1 && opts[0][1] === 'none');

    console.log('[OC-SLURM]   partition hasGpus:', hasGpus, '| opts count:', opts.length);

    if (gpuContainer) {
      gpuContainer.style.display = hasGpus ? 'block' : 'none';
    }
    if (gpusContainer) {
      gpusContainer.style.display = hasGpus ? 'block' : 'none';
    }
  };

  // Re-render script preview without calling execDynamicWidget (which would
  // re-apply partition-level 1D set-max-* directives and overwrite our 2D values).
  function refreshScriptPreview() {
    var sv = [];
    ocForm.updateScriptContents(sv);
    ocForm.scriptArea.value = Object.values(sv).join('\n');
    ocForm.updateHeight(ocForm.scriptArea);
  }

  // Helper: 2D lookup with fallback chain (shared across update functions)
  function lookup2D(map, part, gpu, label) {
    let source = '';
    let val = null;
    if (map[part] && map[part][gpu] !== undefined) {
      val = map[part][gpu]; source = part + '+' + gpu;
    } else if (map[part] && map[part]['any'] !== undefined) {
      val = map[part]['any']; source = part + '+any';
    } else if (map['all'] && map['all'][gpu] !== undefined) {
      val = map['all'][gpu]; source = 'all+' + gpu;
    } else if (map['all'] && map['all']['any'] !== undefined) {
      val = map['all']['any']; source = 'all+any';
    }
    console.log('[OC-SLURM]   2D lookup', label + ':', val, '(from:', source || 'NOT FOUND' + ')');
    return val;
  }

  // 2D lookup: update resource limits based on partition + GPU type
  ocForm.updateResourceLimits = function() {
    const partition = partitionSelect.value;
    const gpuType = gpuTypeSelect ?
      (gpuTypeSelect.options[gpuTypeSelect.selectedIndex]?.getAttribute('data-gpu-id') || 'any') :
      'any';

    console.log('[OC-SLURM] updateResourceLimits() — partition:', partition, '| gpuType:', gpuType);

    // Update cores max
    if (coresInput) {
      const maxCores = lookup2D(coresMap, partition, gpuType, 'cores');
      if (maxCores !== null) {
        coresInput.setAttribute('max', maxCores);
        const coresLabel = document.getElementById('label_cores_memory_1');
        if (coresLabel) {
          coresLabel.innerHTML = 'Number of cores (1 - ' + maxCores + ')';
        }
        if (parseInt(coresInput.value) > maxCores) {
          console.log('[OC-SLURM]   clamping cores from', coresInput.value, 'to', maxCores);
          coresInput.value = maxCores;
        }
      }
    }

    // Update memory max
    if (memoryInput) {
      const maxMem = lookup2D(memoryMap, partition, gpuType, 'memory');
      if (maxMem !== null) {
        memoryInput.setAttribute('max', maxMem);
        const memLabel = document.getElementById('label_cores_memory_2');
        if (memLabel) {
          memLabel.innerHTML = 'Memory (up to ' + maxMem + 'GB)';
        }
        if (parseInt(memoryInput.value) > maxMem) {
          console.log('[OC-SLURM]   clamping memory from', memoryInput.value, 'to', maxMem);
          memoryInput.value = maxMem;
        }
      }
    }

    // Update time max
    if (timeInput) {
      const maxHours = hoursMap[partition] || hoursMap['all'];
      console.log('[OC-SLURM]   hours lookup:', maxHours, '(from:', hoursMap[partition] !== undefined ? partition : 'all' + ')');
      if (maxHours !== undefined) {
        timeInput.setAttribute('max', maxHours);
        const timeLabel = document.getElementById('label_time_1');
        if (timeLabel) {
          timeLabel.innerHTML = 'Max run time hours (0 - ' + maxHours + ')';
        }
        if (parseInt(timeInput.value) > maxHours) {
          console.log('[OC-SLURM]   clamping hours from', timeInput.value, 'to', maxHours);
          timeInput.value = maxHours;
        }
      }
    }
  };

  // 2D lookup: update GPU count limit based on partition + GPU type
  ocForm.updateGpuCountLimits = function() {
    const gpusInput = document.getElementById('gpus');
    if (!gpusInput) return;

    const partition = partitionSelect.value;
    const gpuType = gpuTypeSelect ?
      (gpuTypeSelect.options[gpuTypeSelect.selectedIndex]?.getAttribute('data-gpu-id') || 'any') :
      'any';

    console.log('[OC-SLURM] updateGpuCountLimits() — partition:', partition, '| gpuType:', gpuType);

    const maxGpus = lookup2D(gpuMaxMap, partition, gpuType, 'gpus');
    if (maxGpus !== null && maxGpus > 0) {
      gpusInput.setAttribute('max', maxGpus);
      const gpusLabel = document.getElementById('label_gpus');
      if (gpusLabel) {
        gpusLabel.innerHTML = 'Number of GPUs (1 - ' + maxGpus + ')';
      }
      if (parseInt(gpusInput.value) > maxGpus) {
        console.log('[OC-SLURM]   clamping gpus from', gpusInput.value, 'to', maxGpus);
        gpusInput.value = maxGpus;
      }
    }
  };

  // Show warning if selected GPU type has all nodes down/drained
  ocForm.updateGpuAvailabilityWarning = function() {
    // Remove existing warning
    const existing = document.getElementById('oc-gpu-unavail-warning');
    if (existing) existing.remove();

    if (!gpuTypeSelect || Object.keys(unavailMap).length === 0) {
      console.log('[OC-SLURM] updateGpuAvailabilityWarning() — no unavailable GPUs to check.');
      return;
    }

    const gpuType = gpuTypeSelect.options[gpuTypeSelect.selectedIndex]?.getAttribute('data-gpu-id');
    console.log('[OC-SLURM] updateGpuAvailabilityWarning() — checking gpuType:', gpuType,
      '| is unavailable:', !!unavailMap[gpuType]);

    if (!gpuType || !unavailMap[gpuType]) return;

    console.log('[OC-SLURM]   SHOWING WARNING for', gpuType, '(' + unavailMap[gpuType] + ')');
    const warning = document.createElement('div');
    warning.id = 'oc-gpu-unavail-warning';
    warning.className = 'alert alert-danger mt-2 mb-0 py-2 px-3';
    warning.style.fontSize = '0.9em';
    warning.innerHTML = '<strong>Warning:</strong> All <strong>' + unavailMap[gpuType] +
      '</strong> nodes are currently down or draining. Your job may remain queued indefinitely.';
    gpuTypeSelect.parentNode.appendChild(warning);
  };

  // Wire up event listeners — use setTimeout to run after OC's built-in 1D set-max directives
  partitionSelect.addEventListener('change', function() {
    console.log('[OC-SLURM] === PARTITION CHANGED to:', partitionSelect.value, '===');
    setTimeout(function() {
      ocForm.repopulateGpuTypes();
      // updateArea calls execDynamicWidget which re-applies partition-level
      // set-max-* directives, so our 2D overrides must come AFTER it.
      ocForm.updateArea('script', 'partition');
      ocForm.updateResourceLimits();
      ocForm.updateGpuCountLimits();
      ocForm.updateGpuAvailabilityWarning();
      // Final script re-render to pick up any values clamped by 2D overrides
      refreshScriptPreview();
    }, 0);
  });

  if (gpuTypeSelect) {
    gpuTypeSelect.addEventListener('change', function() {
      const sel = gpuTypeSelect.options[gpuTypeSelect.selectedIndex];
      console.log('[OC-SLURM] === GPU TYPE CHANGED to:', sel?.value,
        '| gpu-id:', sel?.getAttribute('data-gpu-id'),
        '| gres data-value:', sel?.getAttribute('data-value'), '===');
      setTimeout(function() {
        ocForm.updateArea('script', 'gpu_type');
        ocForm.updateResourceLimits();
        ocForm.updateGpuCountLimits();
        ocForm.updateGpuAvailabilityWarning();
        // Final script re-render to pick up any values clamped by 2D overrides
        refreshScriptPreview();
      }, 0);
    });
  }

  // Initial run on page load
  console.log('[OC-SLURM] Scheduling initial run (100ms)...');
  setTimeout(function() {
    console.log('[OC-SLURM] === INITIAL RUN ===');
    ocForm.repopulateGpuTypes();
    // updateArea calls execDynamicWidget which applies partition-level
    // set-max-* directives; our 2D overrides must come AFTER.
    ocForm.updateArea('script', 'gpu_type');
    ocForm.updateResourceLimits();
    ocForm.updateGpuCountLimits();
    ocForm.updateGpuAvailabilityWarning();
    // Final script re-render to pick up any values clamped by 2D overrides
    refreshScriptPreview();
    console.log('[OC-SLURM] === INITIAL RUN COMPLETE ===');
  }, 100);
});
