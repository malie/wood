"use strict";
var react = require('react')
var reactDom = require('react-dom')
var underscore = require('underscore')
var rd = react.DOM;

function cloneObject(x) {
  var res = {}
  for (var nm in x) {
    res[nm] = x[nm]}
  return res}

function model(size) {
  this.size = size;
  this.selectedCol = null;
  this.selectedRow = null;
  this.digits = {}
  this.correctDigits = {}
  this.blacks = {}
  this.givens = {}

  var T = this;
  function key(col, row) {
    return 'c' + col + 'r' + row}

  function currentKey() {
    return key(T.selectedCol, T.selectedRow)}
  
  this.clone = function () {
    var cl = new model(this.size);
    cl.selectedCol = this.selectedCol;
    cl.selectedRow = this.selectedRow;
    cl.digits = cloneObject(this.digits)
    cl.correctDigits = cloneObject(this.correctDigits)
    cl.blacks = cloneObject(this.blacks)
    cl.givens = cloneObject(this.givens)
    return cl}
  
  this.isBlackAt = function (x,y) {
    return this.blacks[key(x,y)]}

  this.digitAt = function (x,y) {
    var d = this.digits[key(x,y)]
    return typeof d === 'number' ? d : null}

  this.isGivenAt = function (x,y) {
    return !!this.givens[key(x,y)]}

  this.isWrong = function (x,y) {
    var k = key(x, y)
    return (typeof this.digits[k] === 'number'
	    && this.correctDigits[k] !== this.digits[k])}
  
  this.isSelected = function (col, row) {
    return (col==this.selectedCol
	    && row == this.selectedRow)}

  this.setSelected = function (col, row) {
    this.selectedCol = col;
    this.selectedRow = row}

  this.selectNothing = function () {
    this.selectedCol = null;
    this.selectedRow = null}

  this.hasSelection = function () {
    return this.selectedCol != null}

  this.setSelectedField = function (digit) {
    this.digits[currentKey()] = digit}

  this.isCurrentGiven = function () {
    return this.givens[key(this.selectedCol,
			   this.selectedRow)]}

  this.clearDigitInSelectedField = function () {
    if (!this.isCurrentGiven()) {
      delete this.digits[currentKey()]}}

  this.toggleBlackAtSelectedField = function () {
    var k = currentKey();
    this.blacks[k] = !this.blacks[k]}

  this.setBlackAt = function (col, row) {
    this.blacks[key(col, row)] = 1}

  this.setDigitAt = function (col, row, digit) {
    this.digits[key(col, row)] = digit}

  this.markAsGivenDigit = function (col, row) {
    this.givens[key(col, row)] = 1}

  this.setCorrectDigitAt = function (col, row, digit) {
    this.correctDigits[key(col, row)] = digit}

  this.digitsInColumnAndRow = function (col, row) {
    var res = [];
    for (var i = 0; i < this.size; i++) {
      res.push(this.digitAt(col, i))
      res.push(this.digitAt(i, row))}
    return res}
}


function initializeModelRandomly(m) {
  var s = m.size;
  function rand() {
    return Math.floor(Math.random()*s)}
  var numBlack = Math.floor(s*1.1);
  for (var i = 0; i < numBlack; i++) {
    var col = rand();
    var row = rand();
    m.setBlackAt(col, row)
    m.setBlackAt(s-col-1, s-row-1)}

  var numDigits = Math.floor(s*2.7);
  for (var i = 0; i < numDigits; i++) {
    var col = rand();
    var row = rand();
    // trying to prevent the worst miss-placements
    var digits = m.digitsInColumnAndRow(col, row);
    var digit = null;
    while (1) {
      digit = rand();
      if (digits.indexOf(digit) == -1)
	break}
    console.log('digits at', col, row, digits, 'placing', digit)
    m.setDigitAt(col, row, digit)}
}



// cell size in pixels
var z = 70;

var Cell = react.createClass({
  render: function () {
    var m = this.props.model;
    var col = this.props.col;
    var row = this.props.row;
    var black = m.isBlackAt(col, row);
    var fillCol = black ? 'black' : 'rgb(255,235,235)';
    if (m.isWrong(col, row)) {
      fillCol = black ? 'rgb(130,0,0)' : 'rgb(255,100,100)'}
    var num = m.digitAt(col, row);
    var sel = m.isSelected(col, row);
    var giv = m.isGivenAt(col, row)
    var sel4 = sel?2:0.5
    var fieldText;
    if (m.size <= 9)
      fieldText = num !== null ? 1+num : ''
    else
      fieldText = num !== null ? "abcdefghijklmnopqrstuvwxyz"[num] : ''
    var rectStroke =
      (sel ? 'rgb(255,80,80)'
       : black ? 'rgb(40,35,35)' : 'rgb(200,190,190)')
    return rd.g(
      {key: 'c'+col+'r'+row,
       onMouseOver: function () { handler.mouseOverField(col,row) },
       onClick: function () { handler.fieldClicked(col,row) }},
      [rd.rect(
	{x: sel4, y:sel4, width:z-sel4*2, height:z-sel4*2,
	 style: {strokeWidth: sel ? 4 : 1,
		 stroke: rectStroke,
		 fill:fillCol},
	 key: 'r'}),
       rd.text({x: 24, y: z-20,
		fontFamily: '"Arial Black", Gadget, sans-serif',
		fontSize: z/2 + (giv ? 5 : -2),
		fontWeight: giv ? 'bold' : 'normal',
		fill: (giv
		       ? (black ? 'white' : 'black')
		       : (black
			  ? 'rgb(255,210,210)'
			  : 'rgb(100,20,20)')),
		key: 't'},
	       fieldText)
      ])
  }
})

var Row = react.createClass({
  render: function () {
    var T = this;
    return (
      rd.g(
	{},
	underscore.range(0, this.props.model.size).map(
	  function (col) {
	    return rd.g({transform: 'translate(' + col*z + ', 1)',
			 key: col},
			[react.createElement(Cell,
					     {row: T.props.row,
					      key: col,
					      col: col,
					      model: T.props.model})]
		       )})))
  }
})


var Page = react.createClass({
  render: function () {
    var mod = this.props.model;
    var size = mod.size;
    var bwidth = size*z;
    var bheight = size*z;
    return rd.svg(
      {width: bwidth,
       height: bheight,
       ref: 'svg', key: 'p',
       style: {boxShadow: '10px 10px 30px rgb(160,140,140)'},
       onMouseLeave: function () { handler.mouseAway() }},
      [underscore.range(0, mod.size).map(
	function (r) {
	  return (
	    rd.g({transform: 'translate(0, ' + r*z + ')',
		  key: r},
		 [react.createElement(Row,
				      {row: r,
				       key: r,
				       model: mod})]))})])}
})

var Controls = react.createClass({
  getInitialState: function () {
    return {digit: null}},
  render: function () {
    var mod = this.props.model;
    var size = mod.size;
    var bwidth = size*z;
    var T = this;
    var digit = this.state.digit;
    return rd.svg(
      {width: bwidth-3,
       height: z-3,
       ref: 'svg', key:'c',
       style: {boxShadow: '10px 10px 30px rgb(160,140,140)',
	       marginTop: z
	      },
      },
      [underscore.range(0, mod.size).map(
	function (c) {
	  function choose(e) {
	    if (c==digit) {
	      handler.setNextClickPuts(null)
	      T.setState({digit: null})}
	    else {
	      handler.setNextClickPuts(c)
	      T.setState({digit: c})}}
	  var b = z*c;
	  var d = 2;
	  return rd.g(
	    {key:''+c},
	    [rd.rect(
	      {x:b , y:0, width:z-d*2, height:z-d*2,
	       key: ''+c,
	       style: {strokeWidth: 1,
		       fill:(c==digit)
		       ? 'rgb(220,205,205)'
		       : 'rgb(255,235,235)'},
	       onClick: choose
	      }),
	      rd.text({x: b+24, y: z-20,
		       fontFamily: '"Arial Black", Gadget, sans-serif',
		       fontSize: z/2,
		       fontWeight: 'normal',
		       fill: 'rgb(100,20,20)',
		       key: 't',
		       onClick: choose},
		      '' + (1+c))
	    ])
	})])}
	  // return (
	  //   rd.g({transform: 'translate(0, ' + r*z + ')',
	  // 	  key: r},
	  // 	 [react.createElement(Row,
	  // 			      {row: r,
	  // 			       key: r,
	  // 			       model: mod})]))}

})
    


var ViewerWithControls = react.createClass({
  render: function () {
    return (
      rd.div(
	{},
	[ react.createElement(Page,
			      {model: this.props.model,
			       key:'p'}),
	  react.createElement(Controls,
			      {model: this.props.model,
			       key: 'c'})
	]
      ))
    }
})


function renderModel(m) {
  var pageElement = react.createElement(ViewerWithControls, {model: m});
  var root = reactDom.render(pageElement,
			     document.getElementById('content'))}

var m = null;
// m = new model(9);
// initializeModelRandomly(m)
// renderModel(m);

function keyDownHandler(e) {
  if (e.ctrlKey || e.altKey || e.metaKey || e.shift)
    return true;
  // if (e.keyCode == 90) // key 'z'
  //   handler.toggleBlack()
  var kc = e.keyCode;
  if ([8,13,46].indexOf(kc) >= 0) { // enter, del, bs
    handler.clearDigit()
    e.preventDefault()
    return false}
  else {
    if (m.size <= 9) {
      var digit = e.keyCode-49;
      if (digit >= 0 && digit < m.size) {
	handler.digitPressed(digit)
	e.preventDefault()
	return false}}
    else {
      var digit = e.keyCode-65;
      if (digit >= 0 && digit < m.size) {
	handler.digitPressed(digit)
	e.preventDefault()
	return false}}}
  return true}

document.addEventListener('keydown', keyDownHandler, false)

var nextClickPuts = null

var handler = {

  setNextClickPuts: function (digit) {
    nextClickPuts = digit},

  fieldClicked: function (col, row) {
    console.log('field clicked', col, row)
    if (!m.isGivenAt(col, row)) {
      m = m.clone();
      m.setSelected(col, row);
      m.setSelectedField(m.isWrong(col,row)
			 ? null : nextClickPuts);
      renderModel(m)}},
  
  mouseOverField: function (col, row) {
    if (m.isGivenAt(col, row)) {
      m = m.clone();
      m.selectNothing()
      renderModel(m)}
    else {
      m = m.clone();
      m.setSelected(col, row);
      renderModel(m)}},

  mouseAway: function () {
    m = m.clone();
    m.selectNothing();
    renderModel(m)},
    
  digitPressed: function (digit) {
    if (digit >= m.size) {
      console.log('bad digit')
      return}
    if (m.hasSelection()
	&& !m.isCurrentGiven())
    {
      m = m.clone();
      m.setSelectedField(digit)
      renderModel(m)}},
  clearDigit: function (digit) {
    if (m.hasSelection()) {
      m = m.clone();
      m.clearDigitInSelectedField()
      renderModel(m)}},
  toggleBlack: function () {
    if (m.hasSelection()) {
      m = m.clone();
      m.toggleBlackAtSelectedField()
      renderModel(m)}}
}

var url64codes =
    "0123456789_-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

function getGameFromURL() {
  var ma = window.location.href.match(/p=([-_a-zA-Z0-9]+)/)
  if (!ma) return;
  var g = ma[1]
  var size = url64codes.indexOf(g[0])
  console.log('size', size)

  var cr = 1492;
  function next() {
    cr = (cr*3+7)%13913131;
    return cr%64}

  m = new model(size)
  var solution = {}
  var x = 0;
  var y = 0;
  for (var i = 1; i < g.length; i++) {
    var c = url64codes.indexOf(g[i]) ^ next()
    if (c&1) {
      // console.log('is black', x, y)
      m.setBlackAt(x, y)}
    
    var isShown = (c&2) == 2;
    // isShown && console.log('is shown', x, y);
    
    var digit = Math.floor(c/4)
    solution['c'+x+'r'+y] = digit;
    if (isShown) {
      m.setDigitAt(x, y, digit)
      m.markAsGivenDigit(x,y)}
    m.setCorrectDigitAt(x, y, digit)

    x += 1
    if (x == size) {
      x = 0
      y += 1}}
      
  renderModel(m);

  var bwidth = m.size*z;
  document.getElementById('content').style.width = '' + bwidth + 'px'

}

getGameFromURL()
