////////////////////////////////////////
// BECAUSE I DON'T WANNA USE REACT.JS //
////////////////////////////////////////

(function(exports){

// Singleton Class
exports.Editor = {};

// DOM
Editor.dom = document.getElementById("editor");

// Create from model
Editor.create = function(){

	//////////////////////
	///// STATES DOM /////
	//////////////////////

	Editor.statesDOM = document.createElement("div");
	Editor.dom.appendChild(Editor.statesDOM);

	// For each state config...
	var stateConfigs = Model.data.states;
	for(var i=0;i<stateConfigs.length;i++){
		var stateConfig = stateConfigs[i];
		var stateDOM = Editor.createStateUI(stateConfig);
		Editor.statesDOM.appendChild(stateDOM);
	}

	// Button - Add a state!
	var addState = document.createElement("div");
	addState.className = "editor_new_state";
	addState.innerHTML = "<span>+</span>new";
	addState.onclick = function(){

		// New state config
		var newStateConfig = {
			id: Model.generateNewID(),
			icon: "💩",
			name: "chocolate",
			actions:[]
		};

		// Add to Model.data
		Model.data.states.push(newStateConfig);

		// Create new DOM & append to states container
		var stateDOM = Editor.createStateUI(newStateConfig);
		Editor.statesDOM.appendChild(stateDOM);

		// Hey y'all
		publish("/ui/addState",[newStateConfig.id]);
		publish("/ui/updateStateHeaders");

	};
	Editor.dom.appendChild(addState);

	// Divider
	var hr = document.createElement("hr");
	Editor.dom.appendChild(hr);

	/////////////////////
	///// WORLD DOM /////
	/////////////////////

	Editor.worldDOM = document.createElement("div");
	Editor.dom.appendChild(Editor.worldDOM);

	Editor.worldDOM.appendChild(Grid.createUI());

};
Editor.createStateUI = function(stateConfig){

	// Create DOM
	var dom = document.createElement("div");
	dom.className = "editor_state";

	// Header: Icon & Title
	var stateHeader = document.createElement("div");
	stateHeader.className = "editor_state_header";
	dom.appendChild(stateHeader);

	// Icon
	var icon = document.createElement("input");
	icon.className = "editor_icon";
	icon.type = "text";
	icon.value = stateConfig.icon;
	icon.oninput = function(){
		stateConfig.icon = icon.value;
		publish("/ui/updateStateHeaders");
	};
	stateHeader.appendChild(icon);

	// Name
	var name = document.createElement("input");
	name.className = "editor_name";
	name.type = "text";
	name.value = stateConfig.name;
	name.oninput = function(){
		stateConfig.name = name.value;
		publish("/ui/updateStateHeaders");
	};
	stateHeader.appendChild(name);

	// Delete (except 0-blank, you CAN'T delete that)
	if(stateConfig.id!=0){
		var deleteDOM = document.createElement("div");
		deleteDOM.className ="delete_state";
		deleteDOM.innerHTML = "⊗";
		(function(stateConfig){
			deleteDOM.onclick = function(){
				Model.removeStateByID(stateConfig.id); // Splice away
				publish("/ui/removeState",[stateConfig.id]); // remove state
				publish("/ui/updateStateHeaders"); // update state headers
				Editor.statesDOM.removeChild(dom); // and, remove this DOM child
			};
		})(stateConfig);
		stateHeader.appendChild(deleteDOM);
	}

	// Actions
	var actionConfigs = stateConfig.actions;
	var actionsDOM = Editor.createActionsUI(actionConfigs);
	dom.appendChild(actionsDOM);

	// Return dom
	return dom;

};

Editor.createActionsUI = function(actionConfigs, dom){

	// Reset/Create DOM
	if(dom){
		dom.innerHTML = "";
	}else{
		dom = document.createElement("div");
		dom.className = "editor_actions";
	}

	// List
	var list = document.createElement("ul");
	dom.appendChild(list);

	// All them actions
	for(var i=0;i<actionConfigs.length;i++){

		// Action
		var actionConfig = actionConfigs[i];

		// Entry
		var entry = document.createElement("li");
		list.appendChild(entry);

		// Delete button
		var deleteDOM = document.createElement("div");
		deleteDOM.className ="delete_action";
		deleteDOM.innerHTML = "⊗";

		(function(actionConfigs,actionConfig,list,entry){

			// WELL HERE'S THE PROBLEM, WE'RE DOING IT BY INDEX,
			// WHEN THE INDEX CAN FRIKKIN' CHANGE.

			deleteDOM.onclick = function(){
				var index = actionConfigs.indexOf(actionConfig);
				actionConfigs.splice(index,1); // Splice away
				list.removeChild(entry); // remove entry
			};

		})(actionConfigs,actionConfig,list,entry);

		entry.appendChild(deleteDOM);

		// The actual action
		var actionDOM = Editor.createActionUI(actionConfigs[i]);
		entry.appendChild(actionDOM);
		
	}

	// Add action?
	var entry = document.createElement("li");
	var addAction = Editor.createActionAdder(actionConfigs, dom);
	entry.appendChild(addAction);
	list.appendChild(entry);
	
	// Return dom
	return dom;

};

Editor.createActionUI = function(actionConfig){
	var action = Actions[actionConfig.type];
	return action.ui(actionConfig);
};

Editor.createLabel = function(words){
	var label = document.createElement("span");
	label.innerHTML = words;
	return label;
};

Editor.createActionAdder = function(actionConfigs, dom){

	var keyValues = [];

	// Default: nothing. just a label.
	keyValues.push({
		name: "+new",
		value:""
	});

	// Populate with Actions
	for(var key in Actions){
		var action = Actions[key];
		var name = action.name;
		var value = key;
		keyValues.push({name:name, value:value});
	}

	// Create select (placeholder options)
	var actionConfig = {action:""};
	var propName = "action";
	var select = Editor.createSelector(keyValues,actionConfig,propName);

	// Select has new oninput
	select.oninput = function(){

		// default, nvm
		if(select.value=="") return;

		// otherwise, add new action to this array
		var key = select.value;
		var defaultProps = Actions[key].props;
		var actionConfig = JSON.parse(JSON.stringify(defaultProps)); // clone
		actionConfig.type = key;
		actionConfigs.push(actionConfig);

		// then, force that DOM to RESET
		Editor.createActionsUI(actionConfigs, dom);

	};

	// Create a better DOM
	var selectContainer = document.createElement("div");
	selectContainer.className ="editor_new_action";
	var button = document.createElement("div");
	button.innerHTML = "+new";
	selectContainer.appendChild(button);
	selectContainer.appendChild(select);

	return selectContainer;

};

Editor.createSelector = function(keyValues, actionConfig, propName){

	// Select.
	var select = document.createElement("select");
	select.type = "select";

	// Populate options: icon + name for each state, value is the ID.
	for(var i=0;i<keyValues.length;i++){
		
		var keyValue = keyValues[i];

		// Create option
		var option = document.createElement("option");
		option.innerHTML = keyValue.name;
		option.value = keyValue.value;
		select.appendChild(option);

		// Is it selected?
		var selectedValue = actionConfig[propName];
		if(keyValue.value==selectedValue){
			option.selected = true;
		}

	}

	// Update the state on change
	select.oninput = function(){
		actionConfig[propName] = select.value;
	};
	
	// Return
	return select;

};

Editor.createStateSelector = function(actionConfig, propName){

	// Select.
	var select = document.createElement("select");
	select.type = "select";

	// Populate options: icon + name for each state, value is the ID.
	var _populateList = function(){
		select.innerHTML = "";
		var stateConfigs = Model.data.states;
		var selectedAnOption = false;
		for(var i=0;i<stateConfigs.length;i++){
			
			var stateConfig = stateConfigs[i];

			// Create option
			var option = document.createElement("option");
			option.innerHTML = stateConfig.icon + ": " + stateConfig.name;
			option.value = stateConfig.id;
			select.appendChild(option);

			// Is it selected?
			var selectedID = actionConfig[propName];
			if(stateConfig.id==selectedID){
				option.selected = true;
				selectedAnOption = true
			}

		}

		// If none was selected, then make blank selected.
		if(!selectedAnOption){
			select.value = 0; // blank
			select.oninput();
		}

	};

	// Update the state on change
	select.oninput = function(){
		actionConfig[propName] = select.value;
	};

	// Call func
	_populateList();

	// Update to OTHERS' changes
	subscribe("/ui/updateStateHeaders",_populateList);
	
	// Return
	return select;

};

Editor.createNumber = function(actionConfig, propName, options){

	// Options?
	options = options || {};
	options.multiplier = options.multiplier || 1;
	// future options - constraints

	// Input
	var input = document.createElement("input");
	input.type = "number";
	input.value = actionConfig[propName]*options.multiplier;
	input.className ="editor_number";

	// Decode value
	var _decodeValue = function(){
		var number;
		if(options.integer){
			number = parseInt(input.value);
		}else{
			number = parseFloat(input.value);
		}
		if(isNaN(number)) number=0; // you messed up
		return number;
	};

	// Update on change
	input.oninput = function(){
		var number = _decodeValue();
		number /= options.multiplier;
		actionConfig[propName] = number;

		// Message?
		if(options.message) publish(options.message);
		
	};

	// When move away, fix it.
	input.onchange = function(){
		input.value = _decodeValue();
	};

	// Return
	return input;

};

Editor.createProportions = function(worldConfig, propName){

	// A div, please.
	var dom = document.createElement("div");
	dom.className = "proportions";

	// Slider array!
	var sliders = [];

	// Populate...
	var proportions = worldConfig[propName];
	var _populate = function(){

		// Reset
		dom.innerHTML = "";
		sliders = [];

		// Also - remake all proportions so it always fits state order, using old parts
		var oldProportions = proportions;
		var newProportions = [];
		for(var i=0;i<Model.data.states.length;i++){

			// State ID
			var stateID = Model.data.states[i].id;

			// Parts
			var parts = 0;
			for(var j=0;j<oldProportions.length;j++){
				if(oldProportions[j].stateID == stateID) parts=oldProportions[j].parts;
			}

			// Do it.
			newProportions.push({stateID:stateID, parts:parts});
		}

		// Replace IN PLACE, so it's the SAME ARRAY, yo.
		var args = [0, oldProportions.length].concat(newProportions); // as arguments
		Array.prototype.splice.apply(proportions, args);

		// For each one...
		for(var i=0;i<proportions.length;i++){
			var proportion = proportions[i];
			var stateID = proportion.stateID;

			// Create Line
			var lineDOM = document.createElement("div");
			dom.appendChild(lineDOM);

			// Create Icon
			var iconDOM = document.createElement("span");
			iconDOM.innerHTML = Model.getStateFromID(stateID).icon;
			lineDOM.appendChild(iconDOM);

			// Create Slider
			var slider = document.createElement("input");
			slider.type = "range";
			slider.min = 0;
			slider.max = 100;
			slider.step = 1;
			sliders.push(slider);
			lineDOM.appendChild(slider);

			// Slider value
			slider.value = proportion.parts;

			// Slider event
			(function(proportion,slider,index){
				slider.onmousedown = function(){
					selectedIndex = index;
					_createSnapshot();
				};
				slider.oninput = function(){
					proportion.parts = parseFloat(slider.value);
					_adjustAll();
					Grid.reinitialize();
				};
				slider.onmouseup = function(){
					selectedIndex = -1;
				};
			})(proportion,slider,i);

		}
	};
	_populate();

	// Adjust 'em all dang it
	var selectedIndex = -1;
	var snapshot = [];
	var _createSnapshot = function(){
		snapshot = [];
		for(var i=0;i<proportions.length;i++){
			snapshot.push(proportions[i].parts); 
		}
	};
	var _adjustAll = function(){

		// SPECIAL CASE: If there's just ONE proportion, set to 100 & disable it.
		// DON'T DO ANYTHING ELSE.
		if(proportions.length==1){
			var newValue = 100;
			proportions[0].parts = newValue;
			sliders[0].value = newValue;
			sliders[0].disabled = true;
			return;
		}else{
			sliders[0].disabled = false;
		}

		// Which one's selected, if any?
		var selectedProportion = (selectedIndex<0) ? null : proportions[selectedIndex];
		var selectedSlider = (selectedIndex<0) ? null : sliders[selectedIndex];

		// FROM SNAPSHOT: Get total parts except selected
		var total = 0;
		for(var i=0;i<snapshot.length;i++){
			if(i!=selectedIndex) total+=snapshot[i];
		}
		
		// EDGE CASE: If old total IS ZERO, bump everything else by one.
		if(total==0){
			for(var i=0;i<snapshot.length;i++){
				if(i!=selectedIndex){
					snapshot[i]=1;
					total += 1;
				}
			}
		}

		// Calculate what the new total SHOULD be, from currently edited slider
		var newTotal = selectedSlider ? 100-parseInt(selectedSlider.value) : 100;

		// How much should each other slider be scaled?
		var newScale = newTotal/total;

		// Scale every non-selected proportion & slider to that, FROM SNAPSHOT
		for(var i=0;i<proportions.length;i++){
			if(i!=selectedIndex){
				var newValue = Math.round(snapshot[i]*newScale);
				proportions[i].parts = newValue;
				sliders[i].value = newValue;
			}
		}

	};

	// in case the data's bonked in the beginning, and doesn't add to 100
	_createSnapshot();
	_adjustAll();

	// When states change...
	subscribe("/ui/updateStateHeaders",function(){

		// Repopulate
		_populate();

		// Adjust to a total of 100
		_createSnapshot();
		_adjustAll();

	});

	return dom;

};

////////////////////////////////////
// SHORTCUTS BECAUSE TYPING SUCKS //
////////////////////////////////////

/*exports.E = {};

E.focus = null;

E.start = function(){
	E.focus = document.createElement("span");
	return E;
};

E.end = function(){
	return E.focus;
};

var _converter = function(funcName){

	// label -> createLabel
	var nickname = funcName.charAt(0).toLowerCase() + funcName.slice(1);
	var fullname = "create" + funcName;
	
	// Automatically appends to focused element & chains it.
	E[nickname] = function(){
		var dom = Editor[fullname].apply(null,arguments);
		E.focus.appendChild(dom);
		return E;
	};

}

_converter("StateUI");
_converter("ActionsUI");
_converter("ActionUI");
_converter("Label");
_converter("ActionAdder");
_converter("Selector");
_converter("StateSelector");
_converter("Number");
_converter("Proportions");*/

})(window);