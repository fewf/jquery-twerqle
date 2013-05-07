g = state.initState(["A", "B", "C", "D"])

test( "init test", function () {
    ok (g.players.length === 4, "4 Players Init'ed");
    ok (g.players[0].tiles.length === 6, "Each has 6 tiles!");
    ok (g.bag.length === ((g.numTypes * g.numTypes) * 3)  - (g.numTypes * 4), "Apropo tiles removed from bag");
});

// set tiles for testing

g.players[0].tiles = [30, 25, 10, 15, 14, 15];
g.players[1].tiles = [35, 24, 2, 28, 32, 15];
g.players[2].tiles = [21, 22, 23, 6, 12, 14];
g.players[3].tiles = [27, 17, 13, 7, 2, 20];


g.bag = [18, 28, 29, 32, 29, 14, 3, 31, 22, 4, 
        17, 20, 18, 26, 8, 3, 13, 19, 27, 0, 5, 
        17, 27, 4, 34, 5, 22, 21, 23, 30, 35, 
        25, 19, 10, 11, 23, 7, 9, 21, 1, 31, 6, 
        20, 33, 8, 24, 33, 19, 6, 31, 7, 0, 8, 
        25, 26, 0, 26, 13, 30, 10, 18, 11, 24, 
        1, 33, 16, 34, 3, 12, 16, 16, 35, 29, 
        4, 34, 28, 11, 5, 9, 2, 9, 1, 12, 32];

g.getStartIndex();

test ( "first player test", function() {
    ok (g.getCurrentPlayer() === g.players[2], "Correct player first");
});
