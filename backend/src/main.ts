/// <reference path="nakama.d.ts" />

function matchInit(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, params: {[key: string]: string}): {state: nkruntime.MatchState, tickRate: number, label: string} {
    return {
        state: { board: Array(9).fill(null), marks: {}, nextTurn: '', winner: null, playerCount: 0 },
        tickRate: 1,
        label: 'tictactoe'
    };
}

function matchJoinAttempt(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presence: nkruntime.Presence, metadata: {[key: string]: any}) {
    return { state: state, accept: state.playerCount < 2 };
}

function matchJoin(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]) {
    presences.forEach(function (p) {
        state.playerCount++;
        if (!state.nextTurn) {
            state.marks[p.userId] = 'X';
            state.nextTurn = p.userId;
        } else {
            state.marks[p.userId] = 'O';
        }
    });
    dispatcher.broadcastMessage(2, JSON.stringify(state));
    return { state: state };
}

function matchLoop(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, messages: nkruntime.MatchData[]) {
    messages.forEach(function (msg) {
        if (msg.opCode === 1) {
            var move = JSON.parse(nk.binaryToString(msg.data));
            if (msg.sender.userId !== state.nextTurn || state.board[move.index] !== null || state.winner) return;

            state.board[move.index] = state.marks[msg.sender.userId];

            var wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
            for (var i = 0; i < wins.length; i++) {
                var w = wins[i];
                if (state.board[w[0]] && state.board[w[0]] === state.board[w[1]] && state.board[w[0]] === state.board[w[2]]) {
                    state.winner = msg.sender.userId;
                }
            }
            var players = Object.keys(state.marks);
            state.nextTurn = players[0] === msg.sender.userId ? (players[1] || '') : players[0];
            dispatcher.broadcastMessage(2, JSON.stringify(state));
        }
    });
    return state.winner ? null : state;
}

function matchLeave(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]) {
    return null; 
}

function matchTerminate(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, graceSeconds: number) {
    return { state: state };
}

function matchSignal(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, data: string) {
    return { state: state, data: data };
}

// THE MAIN ENTRY POINT
// var InitModule: nkruntime.InitModule = function(ctx, logger, nk, initializer) {
//     initializer.registerMatch('tictactoe', {
//         matchInit: matchInit,
//         matchJoinAttempt: matchJoinAttempt,
//         matchJoin: matchJoin,
//         matchLoop: matchLoop,
//         matchLeave: matchLeave,
//         matchTerminate: matchTerminate,
//         matchSignal: matchSignal
//     });
//     logger.info("LILA Tic-Tac-Toe: Match Handler Registered Successfully!");
// };
// Replace your existing InitModule with this one:
function InitModule(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {
    initializer.registerMatch('tictactoe', {
        matchInit: matchInit,
        matchJoinAttempt: matchJoinAttempt,
        matchJoin: matchJoin,
        matchLoop: matchLoop,
        matchLeave: matchLeave,
        matchTerminate: matchTerminate,
        matchSignal: matchSignal
    });

    // ADD THIS RPC: It creates a match and returns the ID to the client
    initializer.registerRpc('find_match', function(ctx, logger, nk, payload) {
        var matches = nk.matchList(1, true, 'tictactoe', 0, 1);
        if (matches.length > 0) {
            return matches[0].matchId;
        }
        return nk.matchCreate('tictactoe', {});
    });

    logger.info("LILA Tic-Tac-Toe: Match Handler & RPC Registered!");
}