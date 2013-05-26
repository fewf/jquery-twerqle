var heldTile;
var validDrop = false;


// $("body").delegate("td.rack", "mousedown", function () {
//   clickedTileNum = Number($(this).attr("title"));
//   clickedTile = $(this).children();
//   console.log(clickedTile);
// });

// $("body").delegate("td.grid", "click", function() { 
//   if (typeof clickedTile !== "undefined") {
//     var row = Number($(this).attr("row"));
//     var col = Number($(this).attr("col"));
//     if (g.placeTile(clickedTile, row, col)) {
//       drawTwerqle();
//       clickedTile = undefined;
//     } else {
//       clickedTile = undefined;
//     }
//   }
// });

// $("body").delegate("td.grid", "mouseup", function() { 
//   if (typeof clickedTileNum !== "undefined") {
//     var row = Number($(this).attr("row"));
//     var col = Number($(this).attr("col"));
//     if (g.placeTile(clickedTileNum, row, col)) {
//       updateTwerqle(clickedTile, row, col);
//       clickedTileNum = undefined;
//     } else {
//       clickedTileNum = undefined;
//     }
//   }
// });

g = state.initState(["A", "B", "C", "D"])

var viewSize = 91;

function getCellByRowCol(row, col) {
  return $('td.grid[row="'+row+'"][col="'+col+'"]');
}

function resetTwerqle(turnHistory) {
  for (var i = g.turnHistory.length - 1; i >= 0; i--) {
    row = g.turnHistory[i][0];
    col = g.turnHistory[i][1];
    getCellByRowCol(row, col).html("");
  };
  var row, col;
  g.resetTurn();
  updatePlayable();
  updatePlayerBoard();
}

function updateTwerqle(tile, tileNum, snappedTo) {
  $(snappedTo).html(scrubTableData(tileNum));
  $(tile).remove();
  updatePlayable();
}

function updatePlayable() {
  $('.playable').removeClass('playable');
  for (var i = g.playable.length - 1; i >= 0; i--) {
    getCellByRowCol(g.playable[i][0], g.playable[i][1]).addClass('playable');
  };
  $( "td.playable" ).droppable({
    // accept: "svg.tile",
    // activeClass: "ui-state-hover",
    // hoverClass: "ui-state-active",
    hoverClass: "highlight",
    drop: function( event, ui ) {

      var row = Number($(this).attr("row"));
      var col = Number($(this).attr("col"));
      var heldTileNum = Number($(heldTile).attr("title"));
      console.log(heldTileNum + " goes on " + $(this).attr("title"));
      if (g.placeTile(heldTileNum, row, col)) {
          updateTwerqle(heldTile, heldTileNum, this);
          validDrop = true;
        } else {
          validDrop = false;
        }
    }
  });
}

function updatePlayerBoard() {
  toAppend = '<div id="players">';
  for (var o = 0; o < g.players.length; o++) {
    toAppend += '<div class="player">';
    toAppend += '<p>' + g.players[o].name +'</p>';
    toAppend += '<p>' + g.players[o].score +'</p>';
    if (g.getCurrentPlayer() === g.players[o]) {
      toAppend += '<table class="rack"><tr>';
      for (var j = 0; j < g.players[o].tiles.length; j++) {
        toAppend += '<td class="rack" title="' + g.players[o].tiles[j] + '">' + getColoredShape(g.players[o].tiles[j]) + '</td>';
      };

      toAppend += '<td><input type="button" onClick="g.endTurn();updatePlayerBoard();" value="end turn" /><input type="button" onClick="resetTwerqle();" value="reset turn" /></td>';
      toAppend += '</tr></table>';
    }
    toAppend += '</div>';
  };
  toAppend += '</div>';
  $('#players').replaceWith(toAppend);
  $('td.rack svg.tile').draggable({
                          revert: validDrop,
                          snapTolerance: 3,
                          // snapMode: "outer",
                          snap:'td.playable',
                          start:  function(event, ui) {
                            heldTile = this;
                            // console.log(heldTileNum);

                            // var draggable = $(this).data("ui-draggable")
                            // $.each(draggable.snapElements, function(index, element) {
                            //   if(element.snapping) {
                            //     draggable._trigger("snapped", event, $.extend({}, ui, {
                            //       snapElement: $(element.item)
                            //     }));
                            //   }
                            // });
                            //  Get the possible snap targets: 
                            // var snapped = $(this).data("ui-draggable").snapElements;

                            // /* Pull out only the snap targets that are "snapping": */
                            // var snappedTo = $.map(snapped, function(element) {
                            //   return element.snapping ? element.item : null;
                            // });

                            // // var row = Number($(snappedTo).attr("row"));
                            // // var col = Number($(snappedTo).attr("col"));

                            // console.log(snappedTo)
                            // if (g.placeTile(heldTileNum, row, col)) {
                            //     updateTwerqle(this, heldTileNum, snappedTo);
                            //   } else {
                            //   }
                            }
                });
}

function drawTwerqle() {
  // var view = getView();
  var toAppend, insert, data;;
  $('#twerqle').replaceWith('<div id="twerqle"></div>');
  var view = g.board;
  var viewSize = 30;
  var start = ( ( view[0].length - 1 ) / 2 ) - 30;
  var end = ( ( view[0].length - 1 ) / 2 ) + 30;
  $('#twerqle').append('<table class="board"></table>');
  var table = $('#twerqle table.board');
  for(var i = start; i < end; i++){
    var insert = '';
    insert += '<tr>';
      for (var j = start; j < end; j++) {
        data = scrubTableData(view[i][j])
        var row = i;
        var col = j;
        insert += '<td class="grid';
        insert += ((i+j) % 2) ? ' alt' : '';
        insert += (g.coordsArePlayable(row, col)) ? ' playable"' : '"';
        insert += ' row="' + row + '" col="' + col + '" title="' + row + ", " + col + '">' + data + '</td>';
      };
    insert += '</tr>';
    $(table).append(insert);
  };
  toAppend = '<div id="players">';
  for (var o = 0; o < g.players.length; o++) {
    toAppend += '<div class="player">';
    toAppend += '<p>' + g.players[o].name +'</p>';
    toAppend += '<p>' + g.players[o].score +'</p>';
    if (g.getCurrentPlayer() === g.players[o]) {
      toAppend += '<table class="rack"><tr>';
      for (var j = 0; j < g.players[o].tiles.length; j++) {
        toAppend += '<td class="rack" title="' + g.players[o].tiles[j] + '">' + getColoredShape(g.players[o].tiles[j]) + '</td>';
      };

      toAppend += '<td><input type="button" onClick="g.endTurn();updatePlayerBoard();" value="end turn" /><input type="button" onClick="resetTwerqle();" value="reset turn" /></td>';
      toAppend += '</tr></table>';
    }
    toAppend += '</div>';
  };
  toAppend += '</div>';
  
  $('#twerqle').append(toAppend);
  $('#twerqle').draggable();
  $('td.rack svg.tile').draggable({
                          revert: function () { return validDrop;},
                          snapTolerance: 3,
                          // snapMode: "outer",
                          snap:'td.playable',
                          start:  function(event, ui) {
                            heldTile = this;
                            // console.log(heldTileNum);

                            // var draggable = $(this).data("ui-draggable")
                            // $.each(draggable.snapElements, function(index, element) {
                            //   if(element.snapping) {
                            //     draggable._trigger("snapped", event, $.extend({}, ui, {
                            //       snapElement: $(element.item)
                            //     }));
                            //   }
                            // });
                            //  Get the possible snap targets: 
                            // var snapped = $(this).data("ui-draggable").snapElements;

                            // /* Pull out only the snap targets that are "snapping": */
                            // var snappedTo = $.map(snapped, function(element) {
                            //   return element.snapping ? element.item : null;
                            // });

                            // // var row = Number($(snappedTo).attr("row"));
                            // // var col = Number($(snappedTo).attr("col"));

                            // console.log(snappedTo)
                            // if (g.placeTile(heldTileNum, row, col)) {
                            //     updateTwerqle(this, heldTileNum, snappedTo);
                            //   } else {
                            //   }
                            }
                });
                    $( "td.playable" ).droppable({
                      // accept: "svg.tile",
                      // activeClass: "ui-state-hover",
                      // hoverClass: "ui-state-active",
                      hoverClass: "highlight",
                      drop: function( event, ui ) {

                        var row = Number($(this).attr("row"));
                        var col = Number($(this).attr("col"));
                        var heldTileNum = Number($(heldTile).attr("title"));
                        console.log(heldTileNum + " goes on " + $(this).attr("title"));
                        if (g.placeTile(heldTileNum, row, col)) {
                            updateTwerqle(heldTile, heldTileNum, this);
                            validDrop = true;
                          } else {
                            validDrop = false;
                          }
                      }
                    });

}



// function getView (exCenter) {
//     if (typeof exCenter === "undefined") exCenter = viewSize;
//     var view = [];
//     for (var i = -exCenter; i <= exCenter; i++) {
//         view.push(g.board[g.center + i].slice(g.center - exCenter, g.center + exCenter + 1));
//     };
//     return view;
// }

var shapes = [
  function(color, tile) { return '<svg title="'+tile+'" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 32 32" class="tile c' + color + '"><path d="m 32.00147,24.581288 -15.301765,0 -15.3017653,0 7.6508826,-13.251717 7.6508827,-13.2517178 7.650883,13.2517178 z" transform="translate(-0.44651618,4.5544652)" /></svg>';},
  function(color, tile) { return '<svg title="'+tile+'" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 32 32" class="tile c' + color + '"><path d="m 32.238469,16.997055 a 15.002944,15.002944 0 1 1 -30.0058879,0 15.002944,15.002944 0 1 1 30.0058879,0 z" transform="translate(-1.1609421,-0.80372916)" /></svg>';},
  function(color, tile) { return '<svg title="'+tile+'" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 32 32" class="tile c' + color + '"><path d="M 16.074583,1.2796854 19.825319,13.960746 30.809618,16.639843 19.468106,17.532875 15.895977,30.481845 13.395486,17.086359 2.4111875,15.568204 13.752699,13.603533 16.074583,1.2796854" /></svg>';},
  function(color, tile) { return '<svg title="'+tile+'" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 32 32" class="tile c' + color + '"><path d="M6,6 26,6 26,26 6,26" /></svg>'; },
  function(color, tile) { return '<svg title="'+tile+'" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 32 32" class="tile c' + color + '"><path d="M 26.165849,3.2443567 C 22.29154,3.2507497 18.418138,3.7011453 14.645732,4.5839053 13.750937,4.7932913 12.857968,5.0281949 12.012454,5.3882027 11.166939,5.7482105 10.366165,6.2387547 9.7340532,6.9057896 9.0218956,7.6572932 8.5436926,8.6172669 8.3154147,9.627126 c -0.2282778,1.009859 -0.2118197,2.067855 -0.010213,3.083375 0.1779948,0.896585 0.4968423,1.758945 0.7136272,2.646949 0.216785,0.888003 0.3292022,1.828988 0.090102,2.711245 -0.2567627,0.947429 -0.8928785,1.741152 -1.5440573,2.475669 -0.6511789,0.734517 -1.3450085,1.457214 -1.7601625,2.346706 -0.3433555,0.73566 -0.4794814,1.568814 -0.3738361,2.373754 0.1056452,0.804939 0.4546363,1.578381 0.9989587,2.180711 0.6787932,0.751131 1.6307407,1.213648 2.6125731,1.460555 0.9818326,0.246907 2.0016256,0.293829 3.0135316,0.32551 0.91775,0.02873 1.839646,0.04571 2.750943,-0.06667 0.911296,-0.112375 1.816986,-0.358851 2.607251,-0.826367 0.913076,-0.54017 1.648878,-1.370996 2.087268,-2.337074 0.43839,-0.966077 0.579372,-2.062623 0.413223,-3.110424 -0.17312,-1.091762 -0.665671,-2.107379 -1.229452,-3.058203 -0.563781,-0.950824 -1.205055,-1.856393 -1.717555,-2.835811 -0.580024,-1.108461 -0.994239,-2.32942 -0.998593,-3.580458 -0.0022,-0.625519 0.09935,-1.253649 0.323646,-1.837576 0.224296,-0.583927 0.573009,-1.122814 1.03216,-1.547619 0.779636,-0.721316 1.836571,-1.0805122 2.890098,-1.2154595 1.053526,-0.1349473 2.120812,-0.06479 3.182522,-0.034786 0.780537,0.022058 1.58399,0.01832 2.310333,-0.2683013 0.363171,-0.1433105 0.701822,-0.3581277 0.962702,-0.6485976 0.26088,-0.29047 0.440845,-0.6590915 0.477701,-1.0477724 C 27.19894,6.281236 26.982462,5.7589834 26.743762,5.2772246 26.505063,4.7954658 26.234965,4.3133665 26.165849,3.7801762 c -0.02302,-0.1776161 -0.02302,-0.3582034 0,-0.5358195" /></svg>';},
  function(color, tile) { return '<svg title="'+tile+'" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 32 32" class="tile c' + color + '"><path d="M 26.523062,25.480864 18.963847,21.727906 16.000601,29.630159 13.309171,21.631245 5.6261034,25.123651 9.3790606,17.564436 1.4768081,14.60119 9.4757217,11.909759 5.9833164,4.2266922 13.542531,7.9796494 16.505777,0.07739694 19.197208,8.0763105 26.880275,4.5839052 23.127318,12.14312 l 7.902252,2.963246 -7.998914,2.69143 z"       transform="matrix(0.93272346,0,0,0.93574528,0.60229056,2.1153676)" /></svg>';}
    ]

function getColoredShape(tile) {
  var color = g.getColor(tile);
  var shape = g.getShape(tile);
  return shapes[shape](color, tile);
}

function scrubTableData(data) {
  if (data === undefined) return "";
  var ret = getColoredShape(data);
  return ret;
}


drawTwerqle();
// $('.playable').removeClass('playable');
// g.playable.push([90,90]);
// g.playable.push([90,91]);
// g.playable.push([90,92]);
// g.playable.push([91,90]);
// g.playable.push([91,92]);
// g.playable.push([92,90]);
// g.playable.push([92,91]);
// g.playable.push([92,92]);
// for (var i = g.playable.length - 1; i >= 0; i--) {
//   getCellByRowCol(g.playable[i][0], g.playable[i][1]).addClass('playable');
// };


// $('body').append(getColoredShape(03));
// $('body').append(getColoredShape(12));
// $('body').append(getColoredShape(23));
// $('body').append('<table><tr><td class="droppable" title="this is my title1"></td></tr><td class="droppable" title="this is my title2"></td></tr><td class="droppable" title="this is my title3"></td></tr></table>')

//   $('svg.tile').draggable({
//                           snapTolerance: 3,
//                           // snapMode: "outer",
//                           snap:'td.droppable',
//                           stop:  function(event, ui) {
//                             var heldTileNum = Number($(this).attr("title"));
//                             // console.log(heldTileNum);

//                             // var draggable = $(this).data("ui-draggable")
//                             // $.each(draggable.snapElements, function(index, element) {
//                             //   if(element.snapping) {
//                             //     draggable._trigger("snapped", event, $.extend({}, ui, {
//                             //       snapElement: $(element.item)
//                             //     }));
//                             //   }
//                             // });
//                             /* Get the possible snap targets: */
//                             // var snapped = $(this).data("ui-draggable").snapElements;

//                             // /* Pull out only the snap targets that are "snapping": */
//                             // var snappedTo = $.map(snapped, function(element) {
//                             //   return element.snapping ? element.item : null;
//                             // });

//                             // var row = Number($(snappedTo).attr("row"));
//                             // var col = Number($(snappedTo).attr("col"));

//                             console.log(heldTileNum)
//                             // if (g.placeTile(heldTileNum, row, col)) {
//                             //     updateTwerqle(this, heldTileNum, snappedTo);
//                             //   } else {
//                             //   }
//                             }
//                 });

//     $( "td.droppable" ).droppable({
//       // accept: "svg.tile",
//       // activeClass: "ui-state-hover",
//       // hoverClass: "ui-state-active",
//       drop: function( event, ui ) {
//         $( this )
//           .addClass( "ui-state-highlight" );
//         console.log($(this).attr("title"));
//       }
//     });