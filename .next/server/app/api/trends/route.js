/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/trends/route";
exports.ids = ["app/api/trends/route"];
exports.modules = {

/***/ "(rsc)/./app/api/trends/route.ts":
/*!*********************************!*\
  !*** ./app/api/trends/route.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var drizzle_orm__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! drizzle-orm */ \"(rsc)/./node_modules/drizzle-orm/sql/sql.js\");\n/* harmony import */ var _barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! __barrel_optimize__?names=endOfMonth,endOfWeek,startOfMonth,startOfWeek,subMonths,subWeeks!=!date-fns */ \"(rsc)/./node_modules/date-fns/startOfWeek.mjs\");\n/* harmony import */ var _barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! __barrel_optimize__?names=endOfMonth,endOfWeek,startOfMonth,startOfWeek,subMonths,subWeeks!=!date-fns */ \"(rsc)/./node_modules/date-fns/subWeeks.mjs\");\n/* harmony import */ var _barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! __barrel_optimize__?names=endOfMonth,endOfWeek,startOfMonth,startOfWeek,subMonths,subWeeks!=!date-fns */ \"(rsc)/./node_modules/date-fns/endOfWeek.mjs\");\n/* harmony import */ var _barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! __barrel_optimize__?names=endOfMonth,endOfWeek,startOfMonth,startOfWeek,subMonths,subWeeks!=!date-fns */ \"(rsc)/./node_modules/date-fns/startOfMonth.mjs\");\n/* harmony import */ var _barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! __barrel_optimize__?names=endOfMonth,endOfWeek,startOfMonth,startOfWeek,subMonths,subWeeks!=!date-fns */ \"(rsc)/./node_modules/date-fns/subMonths.mjs\");\n/* harmony import */ var _barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! __barrel_optimize__?names=endOfMonth,endOfWeek,startOfMonth,startOfWeek,subMonths,subWeeks!=!date-fns */ \"(rsc)/./node_modules/date-fns/endOfMonth.mjs\");\n/* harmony import */ var _db__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../db */ \"(rsc)/./db/index.ts\");\n\n\n\n\nasync function GET(request) {\n    try {\n        const { searchParams } = new URL(request.url);\n        const period = searchParams.get(\"period\") || \"weekly\";\n        const playerIdParam = searchParams.get(\"playerId\");\n        const playerId = playerIdParam ? parseInt(playerIdParam) : undefined;\n        const currentDate = new Date();\n        let trendsData = [];\n        if (period === \"weekly\") {\n            const weekStart = (0,_barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_2__.startOfWeek)((0,_barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_3__.subWeeks)(currentDate, 4));\n            const weekEnd = (0,_barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_4__.endOfWeek)(currentDate);\n            if (playerId) {\n                const results = await _db__WEBPACK_IMPORTED_MODULE_1__.db.execute((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_5__.sql)`\n            SELECT \n              date_trunc('week', date) as period,\n              COUNT(*) as total_games,\n              SUM(CASE \n                WHEN (team_one_player_one_id = ${playerId} OR \n                     team_one_player_two_id = ${playerId} OR \n                     team_one_player_three_id = ${playerId}) AND team_one_games_won > team_two_games_won THEN 1\n                WHEN (team_two_player_one_id = ${playerId} OR \n                     team_two_player_two_id = ${playerId} OR \n                     team_two_player_three_id = ${playerId}) AND team_two_games_won > team_one_games_won THEN 1\n                ELSE 0\n              END) as games_won\n            FROM matches\n            WHERE date >= ${weekStart} AND date <= ${weekEnd}\n            AND (\n              team_one_player_one_id = ${playerId} OR \n              team_one_player_two_id = ${playerId} OR \n              team_one_player_three_id = ${playerId} OR\n              team_two_player_one_id = ${playerId} OR \n              team_two_player_two_id = ${playerId} OR \n              team_two_player_three_id = ${playerId}\n            )\n            GROUP BY period\n            ORDER BY period DESC\n          `);\n                trendsData = results.map((row)=>({\n                        date: row.period,\n                        winRate: row.total_games > 0 ? row.games_won / row.total_games * 100 : 0\n                    }));\n            } else {\n                const results = await _db__WEBPACK_IMPORTED_MODULE_1__.db.execute((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_5__.sql)`\n            SELECT \n              date_trunc('week', date) as period,\n              COUNT(*) as total_games,\n              SUM(CASE WHEN team_one_games_won > team_two_games_won THEN 1 ELSE 0 END) as games_won\n            FROM matches\n            WHERE date >= ${weekStart} AND date <= ${weekEnd}\n            GROUP BY period\n            ORDER BY period DESC\n          `);\n                trendsData = results.map((row)=>({\n                        date: row.period,\n                        winRate: row.total_games > 0 ? row.games_won / row.total_games * 100 : 0\n                    }));\n            }\n        } else {\n            const monthStart = (0,_barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_6__.startOfMonth)((0,_barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_7__.subMonths)(currentDate, 3));\n            const monthEnd = (0,_barrel_optimize_names_endOfMonth_endOfWeek_startOfMonth_startOfWeek_subMonths_subWeeks_date_fns__WEBPACK_IMPORTED_MODULE_8__.endOfMonth)(currentDate);\n            if (playerId) {\n                const results = await _db__WEBPACK_IMPORTED_MODULE_1__.db.execute((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_5__.sql)`\n            SELECT \n              date_trunc('month', date) as period,\n              COUNT(*) as total_games,\n              SUM(CASE \n                WHEN (team_one_player_one_id = ${playerId} OR \n                     team_one_player_two_id = ${playerId} OR \n                     team_one_player_three_id = ${playerId}) AND team_one_games_won > team_two_games_won THEN 1\n                WHEN (team_two_player_one_id = ${playerId} OR \n                     team_two_player_two_id = ${playerId} OR \n                     team_two_player_three_id = ${playerId}) AND team_two_games_won > team_one_games_won THEN 1\n                ELSE 0\n              END) as games_won\n            FROM matches\n            WHERE date >= ${monthStart} AND date <= ${monthEnd}\n            AND (\n              team_one_player_one_id = ${playerId} OR \n              team_one_player_two_id = ${playerId} OR \n              team_one_player_three_id = ${playerId} OR\n              team_two_player_one_id = ${playerId} OR \n              team_two_player_two_id = ${playerId} OR \n              team_two_player_three_id = ${playerId}\n            )\n            GROUP BY period\n            ORDER BY period DESC\n          `);\n                trendsData = results.map((row)=>({\n                        date: row.period,\n                        winRate: row.total_games > 0 ? row.games_won / row.total_games * 100 : 0\n                    }));\n            } else {\n                const results = await _db__WEBPACK_IMPORTED_MODULE_1__.db.execute((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_5__.sql)`\n            SELECT \n              date_trunc('month', date) as period,\n              COUNT(*) as total_games,\n              SUM(CASE WHEN team_one_games_won > team_two_games_won THEN 1 ELSE 0 END) as games_won\n            FROM matches\n            WHERE date >= ${monthStart} AND date <= ${monthEnd}\n            GROUP BY period\n            ORDER BY period DESC\n          `);\n                trendsData = results.map((row)=>({\n                        date: row.period,\n                        winRate: row.total_games > 0 ? row.games_won / row.total_games * 100 : 0\n                    }));\n            }\n        }\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(trendsData);\n    } catch (error) {\n        console.error(\"Error fetching performance trends:\", error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Failed to fetch performance trends\"\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL3RyZW5kcy9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBQzJDO0FBQ1Q7QUFDK0Q7QUFDaEU7QUFHMUIsZUFBZVMsSUFBSUMsT0FBZ0I7SUFDeEMsSUFBSTtRQUNGLE1BQU0sRUFBRUMsWUFBWSxFQUFFLEdBQUcsSUFBSUMsSUFBSUYsUUFBUUcsR0FBRztRQUM1QyxNQUFNQyxTQUFTSCxhQUFhSSxHQUFHLENBQUMsYUFBYTtRQUM3QyxNQUFNQyxnQkFBZ0JMLGFBQWFJLEdBQUcsQ0FBQztRQUN2QyxNQUFNRSxXQUFXRCxnQkFBZ0JFLFNBQVNGLGlCQUFpQkc7UUFFM0QsTUFBTUMsY0FBYyxJQUFJQztRQUV4QixJQUFJQyxhQUFhLEVBQUU7UUFDbkIsSUFBSVIsV0FBVyxVQUFVO1lBQ3ZCLE1BQU1TLFlBQVlyQiw2SUFBV0EsQ0FBQ0ssMElBQVFBLENBQUNhLGFBQWE7WUFDcEQsTUFBTUksVUFBVXJCLDJJQUFTQSxDQUFDaUI7WUFFMUIsSUFBSUgsVUFBVTtnQkFDWixNQUFNUSxVQUFVLE1BQU1qQixtQ0FBRUEsQ0FBQ2tCLE9BQU8sQ0FDOUJ6QixnREFBRyxDQUFDOzs7OzsrQ0FLaUMsRUFBRWdCLFNBQVM7OENBQ1osRUFBRUEsU0FBUztnREFDVCxFQUFFQSxTQUFTOytDQUNaLEVBQUVBLFNBQVM7OENBQ1osRUFBRUEsU0FBUztnREFDVCxFQUFFQSxTQUFTOzs7OzBCQUlqQyxFQUFFTSxVQUFVLGFBQWEsRUFBRUMsUUFBUTs7dUNBRXRCLEVBQUVQLFNBQVM7dUNBQ1gsRUFBRUEsU0FBUzt5Q0FDVCxFQUFFQSxTQUFTO3VDQUNiLEVBQUVBLFNBQVM7dUNBQ1gsRUFBRUEsU0FBUzt5Q0FDVCxFQUFFQSxTQUFTOzs7O1VBSTFDLENBQUM7Z0JBR0hLLGFBQWFHLFFBQVFFLEdBQUcsQ0FBQ0MsQ0FBQUEsTUFBUTt3QkFDL0JDLE1BQU1ELElBQUlkLE1BQU07d0JBQ2hCZ0IsU0FBU0YsSUFBSUcsV0FBVyxHQUFHLElBQUksSUFBS0MsU0FBUyxHQUFHSixJQUFJRyxXQUFXLEdBQUksTUFBTTtvQkFDM0U7WUFDRixPQUFPO2dCQUNMLE1BQU1OLFVBQVUsTUFBTWpCLG1DQUFFQSxDQUFDa0IsT0FBTyxDQUM5QnpCLGdEQUFHLENBQUM7Ozs7OzswQkFNWSxFQUFFc0IsVUFBVSxhQUFhLEVBQUVDLFFBQVE7OztVQUduRCxDQUFDO2dCQUdIRixhQUFhRyxRQUFRRSxHQUFHLENBQUNDLENBQUFBLE1BQVE7d0JBQy9CQyxNQUFNRCxJQUFJZCxNQUFNO3dCQUNoQmdCLFNBQVNGLElBQUlHLFdBQVcsR0FBRyxJQUFJLElBQUtDLFNBQVMsR0FBR0osSUFBSUcsV0FBVyxHQUFJLE1BQU07b0JBQzNFO1lBQ0Y7UUFDRixPQUFPO1lBQ0wsTUFBTUUsYUFBYTdCLDhJQUFZQSxDQUFDRSwySUFBU0EsQ0FBQ2MsYUFBYTtZQUN2RCxNQUFNYyxXQUFXN0IsNElBQVVBLENBQUNlO1lBRTVCLElBQUlILFVBQVU7Z0JBQ1osTUFBTVEsVUFBVSxNQUFNakIsbUNBQUVBLENBQUNrQixPQUFPLENBQzlCekIsZ0RBQUcsQ0FBQzs7Ozs7K0NBS2lDLEVBQUVnQixTQUFTOzhDQUNaLEVBQUVBLFNBQVM7Z0RBQ1QsRUFBRUEsU0FBUzsrQ0FDWixFQUFFQSxTQUFTOzhDQUNaLEVBQUVBLFNBQVM7Z0RBQ1QsRUFBRUEsU0FBUzs7OzswQkFJakMsRUFBRWdCLFdBQVcsYUFBYSxFQUFFQyxTQUFTOzt1Q0FFeEIsRUFBRWpCLFNBQVM7dUNBQ1gsRUFBRUEsU0FBUzt5Q0FDVCxFQUFFQSxTQUFTO3VDQUNiLEVBQUVBLFNBQVM7dUNBQ1gsRUFBRUEsU0FBUzt5Q0FDVCxFQUFFQSxTQUFTOzs7O1VBSTFDLENBQUM7Z0JBR0hLLGFBQWFHLFFBQVFFLEdBQUcsQ0FBQ0MsQ0FBQUEsTUFBUTt3QkFDL0JDLE1BQU1ELElBQUlkLE1BQU07d0JBQ2hCZ0IsU0FBU0YsSUFBSUcsV0FBVyxHQUFHLElBQUksSUFBS0MsU0FBUyxHQUFHSixJQUFJRyxXQUFXLEdBQUksTUFBTTtvQkFDM0U7WUFDRixPQUFPO2dCQUNMLE1BQU1OLFVBQVUsTUFBTWpCLG1DQUFFQSxDQUFDa0IsT0FBTyxDQUM5QnpCLGdEQUFHLENBQUM7Ozs7OzswQkFNWSxFQUFFZ0MsV0FBVyxhQUFhLEVBQUVDLFNBQVM7OztVQUdyRCxDQUFDO2dCQUdIWixhQUFhRyxRQUFRRSxHQUFHLENBQUNDLENBQUFBLE1BQVE7d0JBQy9CQyxNQUFNRCxJQUFJZCxNQUFNO3dCQUNoQmdCLFNBQVNGLElBQUlHLFdBQVcsR0FBRyxJQUFJLElBQUtDLFNBQVMsR0FBR0osSUFBSUcsV0FBVyxHQUFJLE1BQU07b0JBQzNFO1lBQ0Y7UUFDRjtRQUVBLE9BQU8vQixxREFBWUEsQ0FBQ21DLElBQUksQ0FBQ2I7SUFDM0IsRUFBRSxPQUFPYyxPQUFPO1FBQ2RDLFFBQVFELEtBQUssQ0FBQyxzQ0FBc0NBO1FBQ3BELE9BQU9wQyxxREFBWUEsQ0FBQ21DLElBQUksQ0FDdEI7WUFBRUMsT0FBTztRQUFxQyxHQUM5QztZQUFFRSxRQUFRO1FBQUk7SUFFbEI7QUFDRiIsInNvdXJjZXMiOlsiL2hvbWUvcnVubmVyL3dvcmtzcGFjZS9hcHAvYXBpL3RyZW5kcy9yb3V0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCB7IE5leHRSZXNwb25zZSB9IGZyb20gXCJuZXh0L3NlcnZlclwiO1xuaW1wb3J0IHsgc3FsIH0gZnJvbSBcImRyaXp6bGUtb3JtXCI7XG5pbXBvcnQgeyBzdGFydE9mV2VlaywgZW5kT2ZXZWVrLCBzdGFydE9mTW9udGgsIGVuZE9mTW9udGgsIHN1Yk1vbnRocywgc3ViV2Vla3MgfSBmcm9tIFwiZGF0ZS1mbnNcIjtcbmltcG9ydCB7IGRiIH0gZnJvbSBcIi4uLy4uLy4uL2RiXCI7XG5pbXBvcnQgeyBtYXRjaGVzIH0gZnJvbSBcIi4uLy4uLy4uL2RiL3NjaGVtYVwiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gR0VUKHJlcXVlc3Q6IFJlcXVlc3QpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCB7IHNlYXJjaFBhcmFtcyB9ID0gbmV3IFVSTChyZXF1ZXN0LnVybCk7XG4gICAgY29uc3QgcGVyaW9kID0gc2VhcmNoUGFyYW1zLmdldChcInBlcmlvZFwiKSB8fCBcIndlZWtseVwiO1xuICAgIGNvbnN0IHBsYXllcklkUGFyYW0gPSBzZWFyY2hQYXJhbXMuZ2V0KFwicGxheWVySWRcIik7XG4gICAgY29uc3QgcGxheWVySWQgPSBwbGF5ZXJJZFBhcmFtID8gcGFyc2VJbnQocGxheWVySWRQYXJhbSkgOiB1bmRlZmluZWQ7XG4gICAgXG4gICAgY29uc3QgY3VycmVudERhdGUgPSBuZXcgRGF0ZSgpO1xuXG4gICAgbGV0IHRyZW5kc0RhdGEgPSBbXTtcbiAgICBpZiAocGVyaW9kID09PSBcIndlZWtseVwiKSB7XG4gICAgICBjb25zdCB3ZWVrU3RhcnQgPSBzdGFydE9mV2VlayhzdWJXZWVrcyhjdXJyZW50RGF0ZSwgNCkpO1xuICAgICAgY29uc3Qgd2Vla0VuZCA9IGVuZE9mV2VlayhjdXJyZW50RGF0ZSk7XG4gICAgICBcbiAgICAgIGlmIChwbGF5ZXJJZCkge1xuICAgICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgZGIuZXhlY3V0ZShcbiAgICAgICAgICBzcWxgXG4gICAgICAgICAgICBTRUxFQ1QgXG4gICAgICAgICAgICAgIGRhdGVfdHJ1bmMoJ3dlZWsnLCBkYXRlKSBhcyBwZXJpb2QsXG4gICAgICAgICAgICAgIENPVU5UKCopIGFzIHRvdGFsX2dhbWVzLFxuICAgICAgICAgICAgICBTVU0oQ0FTRSBcbiAgICAgICAgICAgICAgICBXSEVOICh0ZWFtX29uZV9wbGF5ZXJfb25lX2lkID0gJHtwbGF5ZXJJZH0gT1IgXG4gICAgICAgICAgICAgICAgICAgICB0ZWFtX29uZV9wbGF5ZXJfdHdvX2lkID0gJHtwbGF5ZXJJZH0gT1IgXG4gICAgICAgICAgICAgICAgICAgICB0ZWFtX29uZV9wbGF5ZXJfdGhyZWVfaWQgPSAke3BsYXllcklkfSkgQU5EIHRlYW1fb25lX2dhbWVzX3dvbiA+IHRlYW1fdHdvX2dhbWVzX3dvbiBUSEVOIDFcbiAgICAgICAgICAgICAgICBXSEVOICh0ZWFtX3R3b19wbGF5ZXJfb25lX2lkID0gJHtwbGF5ZXJJZH0gT1IgXG4gICAgICAgICAgICAgICAgICAgICB0ZWFtX3R3b19wbGF5ZXJfdHdvX2lkID0gJHtwbGF5ZXJJZH0gT1IgXG4gICAgICAgICAgICAgICAgICAgICB0ZWFtX3R3b19wbGF5ZXJfdGhyZWVfaWQgPSAke3BsYXllcklkfSkgQU5EIHRlYW1fdHdvX2dhbWVzX3dvbiA+IHRlYW1fb25lX2dhbWVzX3dvbiBUSEVOIDFcbiAgICAgICAgICAgICAgICBFTFNFIDBcbiAgICAgICAgICAgICAgRU5EKSBhcyBnYW1lc193b25cbiAgICAgICAgICAgIEZST00gbWF0Y2hlc1xuICAgICAgICAgICAgV0hFUkUgZGF0ZSA+PSAke3dlZWtTdGFydH0gQU5EIGRhdGUgPD0gJHt3ZWVrRW5kfVxuICAgICAgICAgICAgQU5EIChcbiAgICAgICAgICAgICAgdGVhbV9vbmVfcGxheWVyX29uZV9pZCA9ICR7cGxheWVySWR9IE9SIFxuICAgICAgICAgICAgICB0ZWFtX29uZV9wbGF5ZXJfdHdvX2lkID0gJHtwbGF5ZXJJZH0gT1IgXG4gICAgICAgICAgICAgIHRlYW1fb25lX3BsYXllcl90aHJlZV9pZCA9ICR7cGxheWVySWR9IE9SXG4gICAgICAgICAgICAgIHRlYW1fdHdvX3BsYXllcl9vbmVfaWQgPSAke3BsYXllcklkfSBPUiBcbiAgICAgICAgICAgICAgdGVhbV90d29fcGxheWVyX3R3b19pZCA9ICR7cGxheWVySWR9IE9SIFxuICAgICAgICAgICAgICB0ZWFtX3R3b19wbGF5ZXJfdGhyZWVfaWQgPSAke3BsYXllcklkfVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgR1JPVVAgQlkgcGVyaW9kXG4gICAgICAgICAgICBPUkRFUiBCWSBwZXJpb2QgREVTQ1xuICAgICAgICAgIGBcbiAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgIHRyZW5kc0RhdGEgPSByZXN1bHRzLm1hcChyb3cgPT4gKHtcbiAgICAgICAgICBkYXRlOiByb3cucGVyaW9kLFxuICAgICAgICAgIHdpblJhdGU6IHJvdy50b3RhbF9nYW1lcyA+IDAgPyAocm93LmdhbWVzX3dvbiAvIHJvdy50b3RhbF9nYW1lcykgKiAxMDAgOiAwXG4gICAgICAgIH0pKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBkYi5leGVjdXRlKFxuICAgICAgICAgIHNxbGBcbiAgICAgICAgICAgIFNFTEVDVCBcbiAgICAgICAgICAgICAgZGF0ZV90cnVuYygnd2VlaycsIGRhdGUpIGFzIHBlcmlvZCxcbiAgICAgICAgICAgICAgQ09VTlQoKikgYXMgdG90YWxfZ2FtZXMsXG4gICAgICAgICAgICAgIFNVTShDQVNFIFdIRU4gdGVhbV9vbmVfZ2FtZXNfd29uID4gdGVhbV90d29fZ2FtZXNfd29uIFRIRU4gMSBFTFNFIDAgRU5EKSBhcyBnYW1lc193b25cbiAgICAgICAgICAgIEZST00gbWF0Y2hlc1xuICAgICAgICAgICAgV0hFUkUgZGF0ZSA+PSAke3dlZWtTdGFydH0gQU5EIGRhdGUgPD0gJHt3ZWVrRW5kfVxuICAgICAgICAgICAgR1JPVVAgQlkgcGVyaW9kXG4gICAgICAgICAgICBPUkRFUiBCWSBwZXJpb2QgREVTQ1xuICAgICAgICAgIGBcbiAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgIHRyZW5kc0RhdGEgPSByZXN1bHRzLm1hcChyb3cgPT4gKHtcbiAgICAgICAgICBkYXRlOiByb3cucGVyaW9kLFxuICAgICAgICAgIHdpblJhdGU6IHJvdy50b3RhbF9nYW1lcyA+IDAgPyAocm93LmdhbWVzX3dvbiAvIHJvdy50b3RhbF9nYW1lcykgKiAxMDAgOiAwXG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgbW9udGhTdGFydCA9IHN0YXJ0T2ZNb250aChzdWJNb250aHMoY3VycmVudERhdGUsIDMpKTtcbiAgICAgIGNvbnN0IG1vbnRoRW5kID0gZW5kT2ZNb250aChjdXJyZW50RGF0ZSk7XG4gICAgICBcbiAgICAgIGlmIChwbGF5ZXJJZCkge1xuICAgICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgZGIuZXhlY3V0ZShcbiAgICAgICAgICBzcWxgXG4gICAgICAgICAgICBTRUxFQ1QgXG4gICAgICAgICAgICAgIGRhdGVfdHJ1bmMoJ21vbnRoJywgZGF0ZSkgYXMgcGVyaW9kLFxuICAgICAgICAgICAgICBDT1VOVCgqKSBhcyB0b3RhbF9nYW1lcyxcbiAgICAgICAgICAgICAgU1VNKENBU0UgXG4gICAgICAgICAgICAgICAgV0hFTiAodGVhbV9vbmVfcGxheWVyX29uZV9pZCA9ICR7cGxheWVySWR9IE9SIFxuICAgICAgICAgICAgICAgICAgICAgdGVhbV9vbmVfcGxheWVyX3R3b19pZCA9ICR7cGxheWVySWR9IE9SIFxuICAgICAgICAgICAgICAgICAgICAgdGVhbV9vbmVfcGxheWVyX3RocmVlX2lkID0gJHtwbGF5ZXJJZH0pIEFORCB0ZWFtX29uZV9nYW1lc193b24gPiB0ZWFtX3R3b19nYW1lc193b24gVEhFTiAxXG4gICAgICAgICAgICAgICAgV0hFTiAodGVhbV90d29fcGxheWVyX29uZV9pZCA9ICR7cGxheWVySWR9IE9SIFxuICAgICAgICAgICAgICAgICAgICAgdGVhbV90d29fcGxheWVyX3R3b19pZCA9ICR7cGxheWVySWR9IE9SIFxuICAgICAgICAgICAgICAgICAgICAgdGVhbV90d29fcGxheWVyX3RocmVlX2lkID0gJHtwbGF5ZXJJZH0pIEFORCB0ZWFtX3R3b19nYW1lc193b24gPiB0ZWFtX29uZV9nYW1lc193b24gVEhFTiAxXG4gICAgICAgICAgICAgICAgRUxTRSAwXG4gICAgICAgICAgICAgIEVORCkgYXMgZ2FtZXNfd29uXG4gICAgICAgICAgICBGUk9NIG1hdGNoZXNcbiAgICAgICAgICAgIFdIRVJFIGRhdGUgPj0gJHttb250aFN0YXJ0fSBBTkQgZGF0ZSA8PSAke21vbnRoRW5kfVxuICAgICAgICAgICAgQU5EIChcbiAgICAgICAgICAgICAgdGVhbV9vbmVfcGxheWVyX29uZV9pZCA9ICR7cGxheWVySWR9IE9SIFxuICAgICAgICAgICAgICB0ZWFtX29uZV9wbGF5ZXJfdHdvX2lkID0gJHtwbGF5ZXJJZH0gT1IgXG4gICAgICAgICAgICAgIHRlYW1fb25lX3BsYXllcl90aHJlZV9pZCA9ICR7cGxheWVySWR9IE9SXG4gICAgICAgICAgICAgIHRlYW1fdHdvX3BsYXllcl9vbmVfaWQgPSAke3BsYXllcklkfSBPUiBcbiAgICAgICAgICAgICAgdGVhbV90d29fcGxheWVyX3R3b19pZCA9ICR7cGxheWVySWR9IE9SIFxuICAgICAgICAgICAgICB0ZWFtX3R3b19wbGF5ZXJfdGhyZWVfaWQgPSAke3BsYXllcklkfVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgR1JPVVAgQlkgcGVyaW9kXG4gICAgICAgICAgICBPUkRFUiBCWSBwZXJpb2QgREVTQ1xuICAgICAgICAgIGBcbiAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgIHRyZW5kc0RhdGEgPSByZXN1bHRzLm1hcChyb3cgPT4gKHtcbiAgICAgICAgICBkYXRlOiByb3cucGVyaW9kLFxuICAgICAgICAgIHdpblJhdGU6IHJvdy50b3RhbF9nYW1lcyA+IDAgPyAocm93LmdhbWVzX3dvbiAvIHJvdy50b3RhbF9nYW1lcykgKiAxMDAgOiAwXG4gICAgICAgIH0pKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBkYi5leGVjdXRlKFxuICAgICAgICAgIHNxbGBcbiAgICAgICAgICAgIFNFTEVDVCBcbiAgICAgICAgICAgICAgZGF0ZV90cnVuYygnbW9udGgnLCBkYXRlKSBhcyBwZXJpb2QsXG4gICAgICAgICAgICAgIENPVU5UKCopIGFzIHRvdGFsX2dhbWVzLFxuICAgICAgICAgICAgICBTVU0oQ0FTRSBXSEVOIHRlYW1fb25lX2dhbWVzX3dvbiA+IHRlYW1fdHdvX2dhbWVzX3dvbiBUSEVOIDEgRUxTRSAwIEVORCkgYXMgZ2FtZXNfd29uXG4gICAgICAgICAgICBGUk9NIG1hdGNoZXNcbiAgICAgICAgICAgIFdIRVJFIGRhdGUgPj0gJHttb250aFN0YXJ0fSBBTkQgZGF0ZSA8PSAke21vbnRoRW5kfVxuICAgICAgICAgICAgR1JPVVAgQlkgcGVyaW9kXG4gICAgICAgICAgICBPUkRFUiBCWSBwZXJpb2QgREVTQ1xuICAgICAgICAgIGBcbiAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgIHRyZW5kc0RhdGEgPSByZXN1bHRzLm1hcChyb3cgPT4gKHtcbiAgICAgICAgICBkYXRlOiByb3cucGVyaW9kLFxuICAgICAgICAgIHdpblJhdGU6IHJvdy50b3RhbF9nYW1lcyA+IDAgPyAocm93LmdhbWVzX3dvbiAvIHJvdy50b3RhbF9nYW1lcykgKiAxMDAgOiAwXG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24odHJlbmRzRGF0YSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIGZldGNoaW5nIHBlcmZvcm1hbmNlIHRyZW5kczpcIiwgZXJyb3IpO1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbihcbiAgICAgIHsgZXJyb3I6IFwiRmFpbGVkIHRvIGZldGNoIHBlcmZvcm1hbmNlIHRyZW5kc1wiIH0sXG4gICAgICB7IHN0YXR1czogNTAwIH1cbiAgICApO1xuICB9XG59XG4iXSwibmFtZXMiOlsiTmV4dFJlc3BvbnNlIiwic3FsIiwic3RhcnRPZldlZWsiLCJlbmRPZldlZWsiLCJzdGFydE9mTW9udGgiLCJlbmRPZk1vbnRoIiwic3ViTW9udGhzIiwic3ViV2Vla3MiLCJkYiIsIkdFVCIsInJlcXVlc3QiLCJzZWFyY2hQYXJhbXMiLCJVUkwiLCJ1cmwiLCJwZXJpb2QiLCJnZXQiLCJwbGF5ZXJJZFBhcmFtIiwicGxheWVySWQiLCJwYXJzZUludCIsInVuZGVmaW5lZCIsImN1cnJlbnREYXRlIiwiRGF0ZSIsInRyZW5kc0RhdGEiLCJ3ZWVrU3RhcnQiLCJ3ZWVrRW5kIiwicmVzdWx0cyIsImV4ZWN1dGUiLCJtYXAiLCJyb3ciLCJkYXRlIiwid2luUmF0ZSIsInRvdGFsX2dhbWVzIiwiZ2FtZXNfd29uIiwibW9udGhTdGFydCIsIm1vbnRoRW5kIiwianNvbiIsImVycm9yIiwiY29uc29sZSIsInN0YXR1cyJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./app/api/trends/route.ts\n");

/***/ }),

/***/ "(rsc)/./db/config.ts":
/*!**********************!*\
  !*** ./db/config.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   getDatabase: () => (/* binding */ getDatabase),\n/* harmony export */   getEnvironment: () => (/* binding */ getEnvironment)\n/* harmony export */ });\n/* harmony import */ var drizzle_orm_neon_http__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! drizzle-orm/neon-http */ \"(rsc)/./node_modules/drizzle-orm/neon-http/driver.js\");\n/* harmony import */ var _neondatabase_serverless__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @neondatabase/serverless */ \"(rsc)/./node_modules/@neondatabase/serverless/index.mjs\");\n/* harmony import */ var ws__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ws */ \"(rsc)/./node_modules/ws/wrapper.mjs\");\n/* harmony import */ var _schema__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./schema */ \"(rsc)/./db/schema.ts\");\n\n\n\n\nconst getEnvironment = ()=>{\n    return \"development\" || 0;\n};\nfunction getDatabase(overrideUrl) {\n    const env = getEnvironment();\n    const dbUrl = overrideUrl || (env === 'test' ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL);\n    if (!dbUrl) {\n        throw new Error(`Database URL must be set for ${env} environment`);\n    }\n    if (env !== 'production') {\n        _neondatabase_serverless__WEBPACK_IMPORTED_MODULE_0__.neonConfig.webSocketConstructor = ws__WEBPACK_IMPORTED_MODULE_1__[\"default\"];\n    }\n    const sql = (0,_neondatabase_serverless__WEBPACK_IMPORTED_MODULE_0__.neon)(dbUrl);\n    return (0,drizzle_orm_neon_http__WEBPACK_IMPORTED_MODULE_3__.drizzle)(sql, {\n        schema: _schema__WEBPACK_IMPORTED_MODULE_2__\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9kYi9jb25maWcudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ2dEO0FBQ1k7QUFDeEM7QUFDZTtBQUU1QixNQUFNSyxpQkFBaUI7SUFDNUIsT0FBT0MsaUJBQXdCLENBQWE7QUFDOUMsRUFBQztBQUVNLFNBQVNDLFlBQVlDLFdBQW9CO0lBQzlDLE1BQU1DLE1BQU1KO0lBQ1osTUFBTUssUUFBUUYsZUFBZ0JDLENBQUFBLFFBQVEsU0FDbENILFFBQVFHLEdBQUcsQ0FBQ0UsaUJBQWlCLEdBQzdCTCxRQUFRRyxHQUFHLENBQUNHLFlBQVk7SUFFNUIsSUFBSSxDQUFDRixPQUFPO1FBQ1YsTUFBTSxJQUFJRyxNQUFNLENBQUMsNkJBQTZCLEVBQUVKLElBQUksWUFBWSxDQUFDO0lBQ25FO0lBRUEsSUFBSUEsUUFBUSxjQUFjO1FBQ3hCUCxnRUFBVUEsQ0FBQ1ksb0JBQW9CLEdBQUdYLDBDQUFFQTtJQUN0QztJQUVBLE1BQU1ZLE1BQU1kLDhEQUFJQSxDQUFDUztJQUVqQixPQUFPViw4REFBT0EsQ0FBQ2UsS0FBSztRQUFFWCxNQUFNQSxzQ0FBQUE7SUFBQztBQUMvQiIsInNvdXJjZXMiOlsiL2hvbWUvcnVubmVyL3dvcmtzcGFjZS9kYi9jb25maWcudHMiXSwic291cmNlc0NvbnRlbnQiOlsiXG5pbXBvcnQgeyBkcml6emxlIH0gZnJvbSBcImRyaXp6bGUtb3JtL25lb24taHR0cFwiO1xuaW1wb3J0IHsgbmVvbiwgbmVvbkNvbmZpZyB9IGZyb20gXCJAbmVvbmRhdGFiYXNlL3NlcnZlcmxlc3NcIjtcbmltcG9ydCB3cyBmcm9tIFwid3NcIjtcbmltcG9ydCAqIGFzIHNjaGVtYSBmcm9tIFwiLi9zY2hlbWFcIjtcblxuZXhwb3J0IGNvbnN0IGdldEVudmlyb25tZW50ID0gKCkgPT4ge1xuICByZXR1cm4gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgfHwgJ2RldmVsb3BtZW50Jztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERhdGFiYXNlKG92ZXJyaWRlVXJsPzogc3RyaW5nKSB7XG4gIGNvbnN0IGVudiA9IGdldEVudmlyb25tZW50KCk7XG4gIGNvbnN0IGRiVXJsID0gb3ZlcnJpZGVVcmwgfHwgKGVudiA9PT0gJ3Rlc3QnIFxuICAgID8gcHJvY2Vzcy5lbnYuVEVTVF9EQVRBQkFTRV9VUkwgXG4gICAgOiBwcm9jZXNzLmVudi5EQVRBQkFTRV9VUkwpO1xuICBcbiAgaWYgKCFkYlVybCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgRGF0YWJhc2UgVVJMIG11c3QgYmUgc2V0IGZvciAke2Vudn0gZW52aXJvbm1lbnRgKTtcbiAgfVxuXG4gIGlmIChlbnYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIG5lb25Db25maWcud2ViU29ja2V0Q29uc3RydWN0b3IgPSB3cztcbiAgfVxuXG4gIGNvbnN0IHNxbCA9IG5lb24oZGJVcmwpO1xuXG4gIHJldHVybiBkcml6emxlKHNxbCwgeyBzY2hlbWEgfSk7XG59XG4iXSwibmFtZXMiOlsiZHJpenpsZSIsIm5lb24iLCJuZW9uQ29uZmlnIiwid3MiLCJzY2hlbWEiLCJnZXRFbnZpcm9ubWVudCIsInByb2Nlc3MiLCJnZXREYXRhYmFzZSIsIm92ZXJyaWRlVXJsIiwiZW52IiwiZGJVcmwiLCJURVNUX0RBVEFCQVNFX1VSTCIsIkRBVEFCQVNFX1VSTCIsIkVycm9yIiwid2ViU29ja2V0Q29uc3RydWN0b3IiLCJzcWwiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./db/config.ts\n");

/***/ }),

/***/ "(rsc)/./db/index.ts":
/*!*********************!*\
  !*** ./db/index.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   db: () => (/* binding */ db)\n/* harmony export */ });\n/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./config */ \"(rsc)/./db/config.ts\");\n\nconst db = (0,_config__WEBPACK_IMPORTED_MODULE_0__.getDatabase)();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9kYi9pbmRleC50cyIsIm1hcHBpbmdzIjoiOzs7OztBQUN1QztBQUNoQyxNQUFNQyxLQUFLRCxvREFBV0EsR0FBRyIsInNvdXJjZXMiOlsiL2hvbWUvcnVubmVyL3dvcmtzcGFjZS9kYi9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCB7IGdldERhdGFiYXNlIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5leHBvcnQgY29uc3QgZGIgPSBnZXREYXRhYmFzZSgpO1xuIl0sIm5hbWVzIjpbImdldERhdGFiYXNlIiwiZGIiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./db/index.ts\n");

/***/ }),

/***/ "(rsc)/./db/schema.ts":
/*!**********************!*\
  !*** ./db/schema.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   achievements: () => (/* binding */ achievements),\n/* harmony export */   insertAchievementSchema: () => (/* binding */ insertAchievementSchema),\n/* harmony export */   insertMatchSchema: () => (/* binding */ insertMatchSchema),\n/* harmony export */   insertPlayerAchievementSchema: () => (/* binding */ insertPlayerAchievementSchema),\n/* harmony export */   insertPlayerSchema: () => (/* binding */ insertPlayerSchema),\n/* harmony export */   matches: () => (/* binding */ matches),\n/* harmony export */   playerAchievements: () => (/* binding */ playerAchievements),\n/* harmony export */   players: () => (/* binding */ players),\n/* harmony export */   selectAchievementSchema: () => (/* binding */ selectAchievementSchema),\n/* harmony export */   selectMatchSchema: () => (/* binding */ selectMatchSchema),\n/* harmony export */   selectPlayerAchievementSchema: () => (/* binding */ selectPlayerAchievementSchema),\n/* harmony export */   selectPlayerSchema: () => (/* binding */ selectPlayerSchema)\n/* harmony export */ });\n/* harmony import */ var drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! drizzle-orm/pg-core */ \"(rsc)/./node_modules/drizzle-orm/pg-core/table.js\");\n/* harmony import */ var drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! drizzle-orm/pg-core */ \"(rsc)/./node_modules/drizzle-orm/pg-core/columns/serial.js\");\n/* harmony import */ var drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! drizzle-orm/pg-core */ \"(rsc)/./node_modules/drizzle-orm/pg-core/columns/text.js\");\n/* harmony import */ var drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! drizzle-orm/pg-core */ \"(rsc)/./node_modules/drizzle-orm/pg-core/columns/integer.js\");\n/* harmony import */ var drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! drizzle-orm/pg-core */ \"(rsc)/./node_modules/drizzle-orm/pg-core/columns/timestamp.js\");\n/* harmony import */ var drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! drizzle-orm/pg-core */ \"(rsc)/./node_modules/drizzle-orm/pg-core/indexes.js\");\n/* harmony import */ var drizzle_zod__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! drizzle-zod */ \"(rsc)/./node_modules/drizzle-zod/index.mjs\");\n\n\nconst players = (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_1__.pgTable)(\"players\", {\n    id: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_2__.serial)(\"id\").primaryKey(),\n    name: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_3__.text)(\"name\").notNull(),\n    startYear: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_4__.integer)(\"start_year\"),\n    createdAt: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_5__.timestamp)(\"created_at\").defaultNow()\n});\nconst matches = (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_1__.pgTable)(\"matches\", {\n    id: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_2__.serial)(\"id\").primaryKey(),\n    // Team One Players\n    teamOnePlayerOneId: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_4__.integer)(\"team_one_player_one_id\").references(()=>players.id),\n    teamOnePlayerTwoId: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_4__.integer)(\"team_one_player_two_id\").references(()=>players.id),\n    teamOnePlayerThreeId: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_4__.integer)(\"team_one_player_three_id\").references(()=>players.id),\n    // Team Two Players\n    teamTwoPlayerOneId: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_4__.integer)(\"team_two_player_one_id\").references(()=>players.id),\n    teamTwoPlayerTwoId: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_4__.integer)(\"team_two_player_two_id\").references(()=>players.id),\n    teamTwoPlayerThreeId: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_4__.integer)(\"team_two_player_three_id\").references(()=>players.id),\n    // Scores\n    teamOneGamesWon: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_4__.integer)(\"team_one_games_won\").notNull(),\n    teamTwoGamesWon: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_4__.integer)(\"team_two_games_won\").notNull(),\n    date: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_5__.timestamp)(\"date\").defaultNow()\n}, (table)=>({\n        teamOnePlayerOneIdx: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_6__.index)(\"team_one_player_one_idx\").on(table.teamOnePlayerOneId),\n        teamOnePlayerTwoIdx: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_6__.index)(\"team_one_player_two_idx\").on(table.teamOnePlayerTwoId),\n        teamOnePlayerThreeIdx: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_6__.index)(\"team_one_player_three_idx\").on(table.teamOnePlayerThreeId),\n        teamTwoPlayerOneIdx: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_6__.index)(\"team_two_player_one_idx\").on(table.teamTwoPlayerOneId),\n        teamTwoPlayerTwoIdx: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_6__.index)(\"team_two_player_two_idx\").on(table.teamTwoPlayerTwoId),\n        teamTwoPlayerThreeIdx: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_6__.index)(\"team_two_player_three_idx\").on(table.teamTwoPlayerThreeId)\n    }));\n// New achievements table\nconst achievements = (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_1__.pgTable)(\"achievements\", {\n    id: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_2__.serial)(\"id\").primaryKey(),\n    name: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_3__.text)(\"name\").notNull(),\n    description: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_3__.text)(\"description\").notNull(),\n    icon: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_3__.text)(\"icon\").notNull(),\n    condition: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_3__.text)(\"condition\").notNull()\n});\n// Player achievements junction table\nconst playerAchievements = (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_1__.pgTable)(\"player_achievements\", {\n    id: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_2__.serial)(\"id\").primaryKey(),\n    playerId: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_4__.integer)(\"player_id\").references(()=>players.id).notNull(),\n    achievementId: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_4__.integer)(\"achievement_id\").references(()=>achievements.id).notNull(),\n    unlockedAt: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_5__.timestamp)(\"unlocked_at\").defaultNow().notNull()\n}, (table)=>({\n        playerAchievementIdx: (0,drizzle_orm_pg_core__WEBPACK_IMPORTED_MODULE_6__.index)(\"player_achievement_idx\").on(table.playerId, table.achievementId)\n    }));\nconst insertPlayerSchema = (0,drizzle_zod__WEBPACK_IMPORTED_MODULE_0__.createInsertSchema)(players);\nconst selectPlayerSchema = (0,drizzle_zod__WEBPACK_IMPORTED_MODULE_0__.createSelectSchema)(players);\nconst insertMatchSchema = (0,drizzle_zod__WEBPACK_IMPORTED_MODULE_0__.createInsertSchema)(matches);\nconst selectMatchSchema = (0,drizzle_zod__WEBPACK_IMPORTED_MODULE_0__.createSelectSchema)(matches);\nconst insertAchievementSchema = (0,drizzle_zod__WEBPACK_IMPORTED_MODULE_0__.createInsertSchema)(achievements);\nconst selectAchievementSchema = (0,drizzle_zod__WEBPACK_IMPORTED_MODULE_0__.createSelectSchema)(achievements);\nconst insertPlayerAchievementSchema = (0,drizzle_zod__WEBPACK_IMPORTED_MODULE_0__.createInsertSchema)(playerAchievements);\nconst selectPlayerAchievementSchema = (0,drizzle_zod__WEBPACK_IMPORTED_MODULE_0__.createSelectSchema)(playerAchievements);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDM0QsR0FBRyxDQUFDZSxRQUFXO1FBQ2JnQixzQkFBc0J0QywwREFBS0EsQ0FBQywwQkFBMEJ3QixFQUFFLENBQUNGLE1BQU1hLFFBQVEsRUFBRWIsTUFBTWMsYUFBYTtJQUM5RixJQUFJO0FBRUcsTUFBTUcscUJBQXFCdEMsK0RBQWtCQSxDQUFDRSxTQUFTO0FBQ3ZELE1BQU1xQyxxQkFBcUJ0QywrREFBa0JBLENBQUNDLFNBQVM7QUFDdkQsTUFBTXNDLG9CQUFvQnhDLCtEQUFrQkEsQ0FBQ1UsU0FBUztBQUN0RCxNQUFNK0Isb0JBQW9CeEMsK0RBQWtCQSxDQUFDUyxTQUFTO0FBQ3RELE1BQU1nQywwQkFBMEIxQywrREFBa0JBLENBQUM2QixjQUFjO0FBQ2pFLE1BQU1jLDBCQUEwQjFDLCtEQUFrQkEsQ0FBQzRCLGNBQWM7QUFDakUsTUFBTWUsZ0NBQWdDNUMsK0RBQWtCQSxDQUFDaUMsb0JBQW9CO0FBQzdFLE1BQU1ZLGdDQUFnQzVDLCtEQUFrQkEsQ0FBQ2dDLG9CQUFvQiIsInNvdXJjZXMiOlsiL2hvbWUvcnVubmVyL3dvcmtzcGFjZS9kYi9zY2hlbWEudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcGdUYWJsZSwgdGV4dCwgc2VyaWFsLCBpbnRlZ2VyLCB0aW1lc3RhbXAsIGluZGV4LCBib29sZWFuIH0gZnJvbSBcImRyaXp6bGUtb3JtL3BnLWNvcmVcIjtcbmltcG9ydCB7IGNyZWF0ZUluc2VydFNjaGVtYSwgY3JlYXRlU2VsZWN0U2NoZW1hIH0gZnJvbSBcImRyaXp6bGUtem9kXCI7XG5cbmV4cG9ydCBjb25zdCBwbGF5ZXJzID0gcGdUYWJsZShcInBsYXllcnNcIiwge1xuICBpZDogc2VyaWFsKFwiaWRcIikucHJpbWFyeUtleSgpLFxuICBuYW1lOiB0ZXh0KFwibmFtZVwiKS5ub3ROdWxsKCksXG4gIHN0YXJ0WWVhcjogaW50ZWdlcihcInN0YXJ0X3llYXJcIiksXG4gIGNyZWF0ZWRBdDogdGltZXN0YW1wKFwiY3JlYXRlZF9hdFwiKS5kZWZhdWx0Tm93KCksXG59KTtcblxuZXhwb3J0IGNvbnN0IG1hdGNoZXMgPSBwZ1RhYmxlKFwibWF0Y2hlc1wiLCB7XG4gIGlkOiBzZXJpYWwoXCJpZFwiKS5wcmltYXJ5S2V5KCksXG4gIC8vIFRlYW0gT25lIFBsYXllcnNcbiAgdGVhbU9uZVBsYXllck9uZUlkOiBpbnRlZ2VyKFwidGVhbV9vbmVfcGxheWVyX29uZV9pZFwiKS5yZWZlcmVuY2VzKCgpID0+IHBsYXllcnMuaWQpLFxuICB0ZWFtT25lUGxheWVyVHdvSWQ6IGludGVnZXIoXCJ0ZWFtX29uZV9wbGF5ZXJfdHdvX2lkXCIpLnJlZmVyZW5jZXMoKCkgPT4gcGxheWVycy5pZCksXG4gIHRlYW1PbmVQbGF5ZXJUaHJlZUlkOiBpbnRlZ2VyKFwidGVhbV9vbmVfcGxheWVyX3RocmVlX2lkXCIpLnJlZmVyZW5jZXMoKCkgPT4gcGxheWVycy5pZCksXG4gIC8vIFRlYW0gVHdvIFBsYXllcnNcbiAgdGVhbVR3b1BsYXllck9uZUlkOiBpbnRlZ2VyKFwidGVhbV90d29fcGxheWVyX29uZV9pZFwiKS5yZWZlcmVuY2VzKCgpID0+IHBsYXllcnMuaWQpLFxuICB0ZWFtVHdvUGxheWVyVHdvSWQ6IGludGVnZXIoXCJ0ZWFtX3R3b19wbGF5ZXJfdHdvX2lkXCIpLnJlZmVyZW5jZXMoKCkgPT4gcGxheWVycy5pZCksXG4gIHRlYW1Ud29QbGF5ZXJUaHJlZUlkOiBpbnRlZ2VyKFwidGVhbV90d29fcGxheWVyX3RocmVlX2lkXCIpLnJlZmVyZW5jZXMoKCkgPT4gcGxheWVycy5pZCksXG4gIC8vIFNjb3Jlc1xuICB0ZWFtT25lR2FtZXNXb246IGludGVnZXIoXCJ0ZWFtX29uZV9nYW1lc193b25cIikubm90TnVsbCgpLFxuICB0ZWFtVHdvR2FtZXNXb246IGludGVnZXIoXCJ0ZWFtX3R3b19nYW1lc193b25cIikubm90TnVsbCgpLFxuICBkYXRlOiB0aW1lc3RhbXAoXCJkYXRlXCIpLmRlZmF1bHROb3coKSxcbn0sICh0YWJsZSkgPT4gKHtcbiAgdGVhbU9uZVBsYXllck9uZUlkeDogaW5kZXgoXCJ0ZWFtX29uZV9wbGF5ZXJfb25lX2lkeFwiKS5vbih0YWJsZS50ZWFtT25lUGxheWVyT25lSWQpLFxuICB0ZWFtT25lUGxheWVyVHdvSWR4OiBpbmRleChcInRlYW1fb25lX3BsYXllcl90d29faWR4XCIpLm9uKHRhYmxlLnRlYW1PbmVQbGF5ZXJUd29JZCksXG4gIHRlYW1PbmVQbGF5ZXJUaHJlZUlkeDogaW5kZXgoXCJ0ZWFtX29uZV9wbGF5ZXJfdGhyZWVfaWR4XCIpLm9uKHRhYmxlLnRlYW1PbmVQbGF5ZXJUaHJlZUlkKSxcbiAgdGVhbVR3b1BsYXllck9uZUlkeDogaW5kZXgoXCJ0ZWFtX3R3b19wbGF5ZXJfb25lX2lkeFwiKS5vbih0YWJsZS50ZWFtVHdvUGxheWVyT25lSWQpLFxuICB0ZWFtVHdvUGxheWVyVHdvSWR4OiBpbmRleChcInRlYW1fdHdvX3BsYXllcl90d29faWR4XCIpLm9uKHRhYmxlLnRlYW1Ud29QbGF5ZXJUd29JZCksXG4gIHRlYW1Ud29QbGF5ZXJUaHJlZUlkeDogaW5kZXgoXCJ0ZWFtX3R3b19wbGF5ZXJfdGhyZWVfaWR4XCIpLm9uKHRhYmxlLnRlYW1Ud29QbGF5ZXJUaHJlZUlkKSxcbn0pKTtcblxuLy8gTmV3IGFjaGlldmVtZW50cyB0YWJsZVxuZXhwb3J0IGNvbnN0IGFjaGlldmVtZW50cyA9IHBnVGFibGUoXCJhY2hpZXZlbWVudHNcIiwge1xuICBpZDogc2VyaWFsKFwiaWRcIikucHJpbWFyeUtleSgpLFxuICBuYW1lOiB0ZXh0KFwibmFtZVwiKS5ub3ROdWxsKCksXG4gIGRlc2NyaXB0aW9uOiB0ZXh0KFwiZGVzY3JpcHRpb25cIikubm90TnVsbCgpLFxuICBpY29uOiB0ZXh0KFwiaWNvblwiKS5ub3ROdWxsKCksIC8vIEFjaGlldmVtZW50IHR5cGUgKGUuZy4sIFwiZ2FtZXNfcGxheWVkXCIsIFwiZ2FtZXNfd29uXCIpXG4gIGNvbmRpdGlvbjogdGV4dChcImNvbmRpdGlvblwiKS5ub3ROdWxsKCksIC8vIEFjaGlldmVtZW50IGNvbmRpdGlvbiAoZS5nLiwgXCJ3aW5zID49IDEwXCIpXG59KTtcblxuLy8gUGxheWVyIGFjaGlldmVtZW50cyBqdW5jdGlvbiB0YWJsZVxuZXhwb3J0IGNvbnN0IHBsYXllckFjaGlldmVtZW50cyA9IHBnVGFibGUoXCJwbGF5ZXJfYWNoaWV2ZW1lbnRzXCIsIHtcbiAgaWQ6IHNlcmlhbChcImlkXCIpLnByaW1hcnlLZXkoKSxcbiAgcGxheWVySWQ6IGludGVnZXIoXCJwbGF5ZXJfaWRcIikucmVmZXJlbmNlcygoKSA9PiBwbGF5ZXJzLmlkKS5ub3ROdWxsKCksXG4gIGFjaGlldmVtZW50SWQ6IGludGVnZXIoXCJhY2hpZXZlbWVudF9pZFwiKS5yZWZlcmVuY2VzKCgpID0+IGFjaGlldmVtZW50cy5pZCkubm90TnVsbCgpLFxuICB1bmxvY2tlZEF0OiB0aW1lc3RhbXAoXCJ1bmxvY2tlZF9hdFwiKS5kZWZhdWx0Tm93KCkubm90TnVsbCgpLFxufSwgKHRhYmxlKSA9PiAoe1xuICBwbGF5ZXJBY2hpZXZlbWVudElkeDogaW5kZXgoXCJwbGF5ZXJfYWNoaWV2ZW1lbnRfaWR4XCIpLm9uKHRhYmxlLnBsYXllcklkLCB0YWJsZS5hY2hpZXZlbWVudElkKSxcbn0pKTtcblxuZXhwb3J0IGNvbnN0IGluc2VydFBsYXllclNjaGVtYSA9IGNyZWF0ZUluc2VydFNjaGVtYShwbGF5ZXJzKTtcbmV4cG9ydCBjb25zdCBzZWxlY3RQbGF5ZXJTY2hlbWEgPSBjcmVhdGVTZWxlY3RTY2hlbWEocGxheWVycyk7XG5leHBvcnQgY29uc3QgaW5zZXJ0TWF0Y2hTY2hlbWEgPSBjcmVhdGVJbnNlcnRTY2hlbWEobWF0Y2hlcyk7XG5leHBvcnQgY29uc3Qgc2VsZWN0TWF0Y2hTY2hlbWEgPSBjcmVhdGVTZWxlY3RTY2hlbWEobWF0Y2hlcyk7XG5leHBvcnQgY29uc3QgaW5zZXJ0QWNoaWV2ZW1lbnRTY2hlbWEgPSBjcmVhdGVJbnNlcnRTY2hlbWEoYWNoaWV2ZW1lbnRzKTtcbmV4cG9ydCBjb25zdCBzZWxlY3RBY2hpZXZlbWVudFNjaGVtYSA9IGNyZWF0ZVNlbGVjdFNjaGVtYShhY2hpZXZlbWVudHMpO1xuZXhwb3J0IGNvbnN0IGluc2VydFBsYXllckFjaGlldmVtZW50U2NoZW1hID0gY3JlYXRlSW5zZXJ0U2NoZW1hKHBsYXllckFjaGlldmVtZW50cyk7XG5leHBvcnQgY29uc3Qgc2VsZWN0UGxheWVyQWNoaWV2ZW1lbnRTY2hlbWEgPSBjcmVhdGVTZWxlY3RTY2hlbWEocGxheWVyQWNoaWV2ZW1lbnRzKTtcblxuZXhwb3J0IHR5cGUgUGxheWVyID0gdHlwZW9mIHBsYXllcnMuJGluZmVyU2VsZWN0O1xuZXhwb3J0IHR5cGUgTmV3UGxheWVyID0gdHlwZW9mIHBsYXllcnMuJGluZmVySW5zZXJ0O1xuZXhwb3J0IHR5cGUgTWF0Y2ggPSB0eXBlb2YgbWF0Y2hlcy4kaW5mZXJTZWxlY3Q7XG5leHBvcnQgdHlwZSBOZXdNYXRjaCA9IHR5cGVvZiBtYXRjaGVzLiRpbmZlckluc2VydDtcbmV4cG9ydCB0eXBlIEFjaGlldmVtZW50ID0gdHlwZW9mIGFjaGlldmVtZW50cy4kaW5mZXJTZWxlY3Q7XG5leHBvcnQgdHlwZSBOZXdBY2hpZXZlbWVudCA9IHR5cGVvZiBhY2hpZXZlbWVudHMuJGluZmVySW5zZXJ0O1xuZXhwb3J0IHR5cGUgUGxheWVyQWNoaWV2ZW1lbnQgPSB0eXBlb2YgcGxheWVyQWNoaWV2ZW1lbnRzLiRpbmZlclNlbGVjdDtcbmV4cG9ydCB0eXBlIE5ld1BsYXllckFjaGlldmVtZW50ID0gdHlwZW9mIHBsYXllckFjaGlldmVtZW50cy4kaW5mZXJJbnNlcnQ7Il0sIm5hbWVzIjpbInBnVGFibGUiLCJ0ZXh0Iiwic2VyaWFsIiwiaW50ZWdlciIsInRpbWVzdGFtcCIsImluZGV4IiwiY3JlYXRlSW5zZXJ0U2NoZW1hIiwiY3JlYXRlU2VsZWN0U2NoZW1hIiwicGxheWVycyIsImlkIiwicHJpbWFyeUtleSIsIm5hbWUiLCJub3ROdWxsIiwic3RhcnRZZWFyIiwiY3JlYXRlZEF0IiwiZGVmYXVsdE5vdyIsIm1hdGNoZXMiLCJ0ZWFtT25lUGxheWVyT25lSWQiLCJyZWZlcmVuY2VzIiwidGVhbU9uZVBsYXllclR3b0lkIiwidGVhbU9uZVBsYXllclRocmVlSWQiLCJ0ZWFtVHdvUGxheWVyT25lSWQiLCJ0ZWFtVHdvUGxheWVyVHdvSWQiLCJ0ZWFtVHdvUGxheWVyVGhyZWVJZCIsInRlYW1PbmVHYW1lc1dvbiIsInRlYW1Ud29HYW1lc1dvbiIsImRhdGUiLCJ0YWJsZSIsInRlYW1PbmVQbGF5ZXJPbmVJZHgiLCJvbiIsInRlYW1PbmVQbGF5ZXJUd29JZHgiLCJ0ZWFtT25lUGxheWVyVGhyZWVJZHgiLCJ0ZWFtVHdvUGxheWVyT25lSWR4IiwidGVhbVR3b1BsYXllclR3b0lkeCIsInRlYW1Ud29QbGF5ZXJUaHJlZUlkeCIsImFjaGlldmVtZW50cyIsImRlc2NyaXB0aW9uIiwiaWNvbiIsImNvbmRpdGlvbiIsInBsYXllckFjaGlldmVtZW50cyIsInBsYXllcklkIiwiYWNoaWV2ZW1lbnRJZCIsInVubG9ja2VkQXQiLCJwbGF5ZXJBY2hpZXZlbWVudElkeCIsImluc2VydFBsYXllclNjaGVtYSIsInNlbGVjdFBsYXllclNjaGVtYSIsImluc2VydE1hdGNoU2NoZW1hIiwic2VsZWN0TWF0Y2hTY2hlbWEiLCJpbnNlcnRBY2hpZXZlbWVudFNjaGVtYSIsInNlbGVjdEFjaGlldmVtZW50U2NoZW1hIiwiaW5zZXJ0UGxheWVyQWNoaWV2ZW1lbnRTY2hlbWEiLCJzZWxlY3RQbGF5ZXJBY2hpZXZlbWVudFNjaGVtYSJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./db/schema.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Ftrends%2Froute&page=%2Fapi%2Ftrends%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Ftrends%2Froute.ts&appDir=%2Fhome%2Frunner%2Fworkspace%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Frunner%2Fworkspace&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!":
/*!**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Ftrends%2Froute&page=%2Fapi%2Ftrends%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Ftrends%2Froute.ts&appDir=%2Fhome%2Frunner%2Fworkspace%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Frunner%2Fworkspace&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D! ***!
  \**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _home_runner_workspace_app_api_trends_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/trends/route.ts */ \"(rsc)/./app/api/trends/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"standalone\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/trends/route\",\n        pathname: \"/api/trends\",\n        filename: \"route\",\n        bundlePath: \"app/api/trends/route\"\n    },\n    resolvedPagePath: \"/home/runner/workspace/app/api/trends/route.ts\",\n    nextConfigOutput,\n    userland: _home_runner_workspace_app_api_trends_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZ0cmVuZHMlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRnRyZW5kcyUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRnRyZW5kcyUyRnJvdXRlLnRzJmFwcERpcj0lMkZob21lJTJGcnVubmVyJTJGd29ya3NwYWNlJTJGYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj0lMkZob21lJTJGcnVubmVyJTJGd29ya3NwYWNlJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PXN0YW5kYWxvbmUmcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBK0Y7QUFDdkM7QUFDcUI7QUFDRjtBQUMzRTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IseUdBQW1CO0FBQzNDO0FBQ0EsY0FBYyxrRUFBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsWUFBWTtBQUNaLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxRQUFRLHNEQUFzRDtBQUM5RDtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUMwRjs7QUFFMUYiLCJzb3VyY2VzIjpbIiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBSb3V0ZVJvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUtbW9kdWxlcy9hcHAtcm91dGUvbW9kdWxlLmNvbXBpbGVkXCI7XG5pbXBvcnQgeyBSb3V0ZUtpbmQgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiL2hvbWUvcnVubmVyL3dvcmtzcGFjZS9hcHAvYXBpL3RyZW5kcy9yb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJzdGFuZGFsb25lXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL3RyZW5kcy9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL3RyZW5kc1wiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvdHJlbmRzL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiL2hvbWUvcnVubmVyL3dvcmtzcGFjZS9hcHAvYXBpL3RyZW5kcy9yb3V0ZS50c1wiLFxuICAgIG5leHRDb25maWdPdXRwdXQsXG4gICAgdXNlcmxhbmRcbn0pO1xuLy8gUHVsbCBvdXQgdGhlIGV4cG9ydHMgdGhhdCB3ZSBuZWVkIHRvIGV4cG9zZSBmcm9tIHRoZSBtb2R1bGUuIFRoaXMgc2hvdWxkXG4vLyBiZSBlbGltaW5hdGVkIHdoZW4gd2UndmUgbW92ZWQgdGhlIG90aGVyIHJvdXRlcyB0byB0aGUgbmV3IGZvcm1hdC4gVGhlc2Vcbi8vIGFyZSB1c2VkIHRvIGhvb2sgaW50byB0aGUgcm91dGUuXG5jb25zdCB7IHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5mdW5jdGlvbiBwYXRjaEZldGNoKCkge1xuICAgIHJldHVybiBfcGF0Y2hGZXRjaCh7XG4gICAgICAgIHdvcmtBc3luY1N0b3JhZ2UsXG4gICAgICAgIHdvcmtVbml0QXN5bmNTdG9yYWdlXG4gICAgfSk7XG59XG5leHBvcnQgeyByb3V0ZU1vZHVsZSwgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Ftrends%2Froute&page=%2Fapi%2Ftrends%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Ftrends%2Froute.ts&appDir=%2Fhome%2Frunner%2Fworkspace%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Frunner%2Fworkspace&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "?66e9":
/*!********************************!*\
  !*** utf-8-validate (ignored) ***!
  \********************************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ "net":
/*!**********************!*\
  !*** external "net" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("net");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "tls":
/*!**********************!*\
  !*** external "tls" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("tls");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/drizzle-orm","vendor-chunks/ws","vendor-chunks/date-fns","vendor-chunks/node-gyp-build","vendor-chunks/bufferutil","vendor-chunks/zod","vendor-chunks/drizzle-zod","vendor-chunks/@neondatabase"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Ftrends%2Froute&page=%2Fapi%2Ftrends%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Ftrends%2Froute.ts&appDir=%2Fhome%2Frunner%2Fworkspace%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Frunner%2Fworkspace&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();