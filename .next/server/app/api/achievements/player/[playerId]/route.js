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
exports.id = "app/api/achievements/player/[playerId]/route";
exports.ids = ["app/api/achievements/player/[playerId]/route"];
exports.modules = {

/***/ "(rsc)/./app/api/achievements/player/[playerId]/route.ts":
/*!*********************************************************!*\
  !*** ./app/api/achievements/player/[playerId]/route.ts ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n\n// Mock achievements as fallback data\nconst mockAchievements = [\n    {\n        id: 1,\n        name: 'First Victory',\n        description: 'Win your first match',\n        icon: '🏆',\n        unlockedAt: '2023-01-15T12:34:56Z'\n    },\n    {\n        id: 2,\n        name: 'Win Streak',\n        description: 'Win 3 matches in a row',\n        icon: '🔥',\n        unlockedAt: '2023-02-10T15:30:00Z'\n    },\n    {\n        id: 3,\n        name: 'Team Player',\n        description: 'Play with 5 different teammates',\n        icon: '👥',\n        unlockedAt: '2023-03-05T14:22:33Z'\n    },\n    {\n        id: 4,\n        name: 'Veteran',\n        description: 'Play 50 matches',\n        icon: '🎖️',\n        unlockedAt: null\n    },\n    {\n        id: 5,\n        name: 'Comeback King',\n        description: 'Win a match after being down by 5 points',\n        icon: '👑',\n        unlockedAt: null\n    }\n];\nasync function GET(request, { params }) {\n    try {\n        const playerId = parseInt(await params.playerId);\n        if (isNaN(playerId)) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'Invalid player ID'\n            }, {\n                status: 400\n            });\n        }\n        // Return the mock achievements directly for now since the original API\n        // appears to be returning HTML instead of JSON\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(mockAchievements);\n    } catch (error) {\n        console.error(`Error in achievements API:`, error);\n        // Return mock achievements as fallback\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(mockAchievements);\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL2FjaGlldmVtZW50cy9wbGF5ZXIvW3BsYXllcklkXS9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7OztBQUEyQztBQUUzQyxxQ0FBcUM7QUFDckMsTUFBTUMsbUJBQW1CO0lBQ3ZCO1FBQ0VDLElBQUk7UUFDSkMsTUFBTTtRQUNOQyxhQUFhO1FBQ2JDLE1BQU07UUFDTkMsWUFBWTtJQUNkO0lBQ0E7UUFDRUosSUFBSTtRQUNKQyxNQUFNO1FBQ05DLGFBQWE7UUFDYkMsTUFBTTtRQUNOQyxZQUFZO0lBQ2Q7SUFDQTtRQUNFSixJQUFJO1FBQ0pDLE1BQU07UUFDTkMsYUFBYTtRQUNiQyxNQUFNO1FBQ05DLFlBQVk7SUFDZDtJQUNBO1FBQ0VKLElBQUk7UUFDSkMsTUFBTTtRQUNOQyxhQUFhO1FBQ2JDLE1BQU07UUFDTkMsWUFBWTtJQUNkO0lBQ0E7UUFDRUosSUFBSTtRQUNKQyxNQUFNO1FBQ05DLGFBQWE7UUFDYkMsTUFBTTtRQUNOQyxZQUFZO0lBQ2Q7Q0FDRDtBQUVNLGVBQWVDLElBQ3BCQyxPQUFnQixFQUNoQixFQUFFQyxNQUFNLEVBQW9DO0lBRTVDLElBQUk7UUFDRixNQUFNQyxXQUFXQyxTQUFTLE1BQU1GLE9BQU9DLFFBQVE7UUFFL0MsSUFBSUUsTUFBTUYsV0FBVztZQUNuQixPQUFPVixxREFBWUEsQ0FBQ2EsSUFBSSxDQUN0QjtnQkFBRUMsT0FBTztZQUFvQixHQUM3QjtnQkFBRUMsUUFBUTtZQUFJO1FBRWxCO1FBRUEsdUVBQXVFO1FBQ3ZFLCtDQUErQztRQUMvQyxPQUFPZixxREFBWUEsQ0FBQ2EsSUFBSSxDQUFDWjtJQUMzQixFQUFFLE9BQU9hLE9BQU87UUFDZEUsUUFBUUYsS0FBSyxDQUFDLENBQUMsMEJBQTBCLENBQUMsRUFBRUE7UUFDNUMsdUNBQXVDO1FBQ3ZDLE9BQU9kLHFEQUFZQSxDQUFDYSxJQUFJLENBQUNaO0lBQzNCO0FBQ0YiLCJzb3VyY2VzIjpbIi9ob21lL3J1bm5lci93b3Jrc3BhY2UvYXBwL2FwaS9hY2hpZXZlbWVudHMvcGxheWVyL1twbGF5ZXJJZF0vcm91dGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmV4dFJlc3BvbnNlIH0gZnJvbSAnbmV4dC9zZXJ2ZXInO1xuXG4vLyBNb2NrIGFjaGlldmVtZW50cyBhcyBmYWxsYmFjayBkYXRhXG5jb25zdCBtb2NrQWNoaWV2ZW1lbnRzID0gW1xuICB7XG4gICAgaWQ6IDEsXG4gICAgbmFtZTogJ0ZpcnN0IFZpY3RvcnknLFxuICAgIGRlc2NyaXB0aW9uOiAnV2luIHlvdXIgZmlyc3QgbWF0Y2gnLFxuICAgIGljb246ICfwn4+GJyxcbiAgICB1bmxvY2tlZEF0OiAnMjAyMy0wMS0xNVQxMjozNDo1NlonXG4gIH0sXG4gIHtcbiAgICBpZDogMixcbiAgICBuYW1lOiAnV2luIFN0cmVhaycsXG4gICAgZGVzY3JpcHRpb246ICdXaW4gMyBtYXRjaGVzIGluIGEgcm93JyxcbiAgICBpY29uOiAn8J+UpScsXG4gICAgdW5sb2NrZWRBdDogJzIwMjMtMDItMTBUMTU6MzA6MDBaJ1xuICB9LFxuICB7XG4gICAgaWQ6IDMsXG4gICAgbmFtZTogJ1RlYW0gUGxheWVyJyxcbiAgICBkZXNjcmlwdGlvbjogJ1BsYXkgd2l0aCA1IGRpZmZlcmVudCB0ZWFtbWF0ZXMnLFxuICAgIGljb246ICfwn5GlJyxcbiAgICB1bmxvY2tlZEF0OiAnMjAyMy0wMy0wNVQxNDoyMjozM1onXG4gIH0sXG4gIHtcbiAgICBpZDogNCxcbiAgICBuYW1lOiAnVmV0ZXJhbicsXG4gICAgZGVzY3JpcHRpb246ICdQbGF5IDUwIG1hdGNoZXMnLFxuICAgIGljb246ICfwn46W77iPJyxcbiAgICB1bmxvY2tlZEF0OiBudWxsXG4gIH0sXG4gIHtcbiAgICBpZDogNSxcbiAgICBuYW1lOiAnQ29tZWJhY2sgS2luZycsXG4gICAgZGVzY3JpcHRpb246ICdXaW4gYSBtYXRjaCBhZnRlciBiZWluZyBkb3duIGJ5IDUgcG9pbnRzJyxcbiAgICBpY29uOiAn8J+RkScsXG4gICAgdW5sb2NrZWRBdDogbnVsbFxuICB9XG5dO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gR0VUKFxuICByZXF1ZXN0OiBSZXF1ZXN0LFxuICB7IHBhcmFtcyB9OiB7IHBhcmFtczogeyBwbGF5ZXJJZDogc3RyaW5nIH0gfVxuKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcGxheWVySWQgPSBwYXJzZUludChhd2FpdCBwYXJhbXMucGxheWVySWQpO1xuXG4gICAgaWYgKGlzTmFOKHBsYXllcklkKSkge1xuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKFxuICAgICAgICB7IGVycm9yOiAnSW52YWxpZCBwbGF5ZXIgSUQnIH0sXG4gICAgICAgIHsgc3RhdHVzOiA0MDAgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gdGhlIG1vY2sgYWNoaWV2ZW1lbnRzIGRpcmVjdGx5IGZvciBub3cgc2luY2UgdGhlIG9yaWdpbmFsIEFQSVxuICAgIC8vIGFwcGVhcnMgdG8gYmUgcmV0dXJuaW5nIEhUTUwgaW5zdGVhZCBvZiBKU09OXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKG1vY2tBY2hpZXZlbWVudHMpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIGluIGFjaGlldmVtZW50cyBBUEk6YCwgZXJyb3IpO1xuICAgIC8vIFJldHVybiBtb2NrIGFjaGlldmVtZW50cyBhcyBmYWxsYmFja1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbihtb2NrQWNoaWV2ZW1lbnRzKTtcbiAgfVxufSJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJtb2NrQWNoaWV2ZW1lbnRzIiwiaWQiLCJuYW1lIiwiZGVzY3JpcHRpb24iLCJpY29uIiwidW5sb2NrZWRBdCIsIkdFVCIsInJlcXVlc3QiLCJwYXJhbXMiLCJwbGF5ZXJJZCIsInBhcnNlSW50IiwiaXNOYU4iLCJqc29uIiwiZXJyb3IiLCJzdGF0dXMiLCJjb25zb2xlIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./app/api/achievements/player/[playerId]/route.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fachievements%2Fplayer%2F%5BplayerId%5D%2Froute&page=%2Fapi%2Fachievements%2Fplayer%2F%5BplayerId%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fachievements%2Fplayer%2F%5BplayerId%5D%2Froute.ts&appDir=%2Fhome%2Frunner%2Fworkspace%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Frunner%2Fworkspace&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!":
/*!**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fachievements%2Fplayer%2F%5BplayerId%5D%2Froute&page=%2Fapi%2Fachievements%2Fplayer%2F%5BplayerId%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fachievements%2Fplayer%2F%5BplayerId%5D%2Froute.ts&appDir=%2Fhome%2Frunner%2Fworkspace%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Frunner%2Fworkspace&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D! ***!
  \**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _home_runner_workspace_app_api_achievements_player_playerId_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/achievements/player/[playerId]/route.ts */ \"(rsc)/./app/api/achievements/player/[playerId]/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"standalone\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/achievements/player/[playerId]/route\",\n        pathname: \"/api/achievements/player/[playerId]\",\n        filename: \"route\",\n        bundlePath: \"app/api/achievements/player/[playerId]/route\"\n    },\n    resolvedPagePath: \"/home/runner/workspace/app/api/achievements/player/[playerId]/route.ts\",\n    nextConfigOutput,\n    userland: _home_runner_workspace_app_api_achievements_player_playerId_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZhY2hpZXZlbWVudHMlMkZwbGF5ZXIlMkYlNUJwbGF5ZXJJZCU1RCUyRnJvdXRlJnBhZ2U9JTJGYXBpJTJGYWNoaWV2ZW1lbnRzJTJGcGxheWVyJTJGJTVCcGxheWVySWQlNUQlMkZyb3V0ZSZhcHBQYXRocz0mcGFnZVBhdGg9cHJpdmF0ZS1uZXh0LWFwcC1kaXIlMkZhcGklMkZhY2hpZXZlbWVudHMlMkZwbGF5ZXIlMkYlNUJwbGF5ZXJJZCU1RCUyRnJvdXRlLnRzJmFwcERpcj0lMkZob21lJTJGcnVubmVyJTJGd29ya3NwYWNlJTJGYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj0lMkZob21lJTJGcnVubmVyJTJGd29ya3NwYWNlJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PXN0YW5kYWxvbmUmcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBK0Y7QUFDdkM7QUFDcUI7QUFDc0I7QUFDbkc7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLHlHQUFtQjtBQUMzQztBQUNBLGNBQWMsa0VBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxzREFBc0Q7QUFDOUQ7QUFDQSxXQUFXLDRFQUFXO0FBQ3RCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDMEY7O0FBRTFGIiwic291cmNlcyI6WyIiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIi9ob21lL3J1bm5lci93b3Jrc3BhY2UvYXBwL2FwaS9hY2hpZXZlbWVudHMvcGxheWVyL1twbGF5ZXJJZF0vcm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwic3RhbmRhbG9uZVwiXG5jb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBBcHBSb3V0ZVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5BUFBfUk9VVEUsXG4gICAgICAgIHBhZ2U6IFwiL2FwaS9hY2hpZXZlbWVudHMvcGxheWVyL1twbGF5ZXJJZF0vcm91dGVcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2FwaS9hY2hpZXZlbWVudHMvcGxheWVyL1twbGF5ZXJJZF1cIixcbiAgICAgICAgZmlsZW5hbWU6IFwicm91dGVcIixcbiAgICAgICAgYnVuZGxlUGF0aDogXCJhcHAvYXBpL2FjaGlldmVtZW50cy9wbGF5ZXIvW3BsYXllcklkXS9yb3V0ZVwiXG4gICAgfSxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIi9ob21lL3J1bm5lci93b3Jrc3BhY2UvYXBwL2FwaS9hY2hpZXZlbWVudHMvcGxheWVyL1twbGF5ZXJJZF0vcm91dGUudHNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICB3b3JrQXN5bmNTdG9yYWdlLFxuICAgICAgICB3b3JrVW5pdEFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fachievements%2Fplayer%2F%5BplayerId%5D%2Froute&page=%2Fapi%2Fachievements%2Fplayer%2F%5BplayerId%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fachievements%2Fplayer%2F%5BplayerId%5D%2Froute.ts&appDir=%2Fhome%2Frunner%2Fworkspace%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Frunner%2Fworkspace&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!\n");

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

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fachievements%2Fplayer%2F%5BplayerId%5D%2Froute&page=%2Fapi%2Fachievements%2Fplayer%2F%5BplayerId%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fachievements%2Fplayer%2F%5BplayerId%5D%2Froute.ts&appDir=%2Fhome%2Frunner%2Fworkspace%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Frunner%2Fworkspace&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();