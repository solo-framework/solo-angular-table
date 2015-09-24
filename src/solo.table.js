/**
AngularJS table with filters, sorting and pagination

The MIT License (MIT)

Copyright (c) 2013 Andrey Filippov <solo.framework@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

 */

angular.module("solo.table", [])

	.controller("SoloTableCtrl", ['$scope', function ($scope){

		$scope.original = [];

		$scope.bindData = function(data)
		{
			$scope.original = data;
		};

		/**
		 * По этой коллекции нужно выполнять ng-repeat
		 *
		 * @type Array
		 */
		$scope.filtered = [];

		$scope.order = {
			header: null,
			direction: false
		};

		$scope.tableHeaders = {};

		/**
		 * Проверка переданного параметра на принадлежность к promise-объекту
		 *
		 * @param variableToCheck
		 * @returns {*|boolean}
		 */
		$scope.isPromise = function(variableToCheck) {
			return (variableToCheck && angular.isFunction(variableToCheck.then));
		};

		/**
		 * Описание пейджера
		 *
		 * @type onPage: number, currentPage: number, found: number, total: Number, foundPages: number
		 */
		$scope.pager = {
			onPage: 10, // сколько записей на странице
			currentPage: 1, // номер текущей страницы
			found: 0, // найдено записей
			foundPages: 0, // количество страниц в таблице

			/**
			 * Устанавливает количество записей на странице
			 * @param num int Количество записей на странице
			 */
			setOnPage: function(num)
			{
				this.onPage = parseInt(num);
				this.update($scope.filtered.length);
			},

			/**
			 * Возвращает количество записей на странице
			 * @returns int
			 */
			getOnPage: function()
			{
				return this.onPage;
			},

			/**
			 * Обновляет данные пейджера
			 * @param len int Количество записей в таблице (после применения фильтра)
			 */
			update: function(len)
			{
				this.found = len;
				this.foundPages = Math.ceil(len / this.onPage);
				this.currentPage = 1;
			}
		};

		/**
		 * Режим сортировки:
		 * 2 - только ASC и DESC
		 * 3 - default, ASC и DESC
		 *
		 * @type {number}
		 */
		$scope.sortMode = 2;

		/**
		 * Установка режима сортировки
		 * @param mode
		 */
		$scope.setSortMode = function(mode)
		{
			if (mode == "" || mode == null)
				$scope.sortMode = 2;
			else
				$scope.sortMode = parseInt(mode);
		};


		/**
		 * Переход на следующую страницу
		 */
		$scope.gotoNextPage = function()
		{
			if ($scope.pager.foundPages == $scope.pager.currentPage)
				return true;

			$scope.pager.currentPage++;
		};

		/**
		 * Переход на первую страницу
		 */
		$scope.gotoFirstPage = function ()
		{
			$scope.pager.currentPage = 1;
		};

		/**
		 * Переход на последнюю страницу
		 */
		$scope.gotoLastPage = function ()
		{
			$scope.pager.currentPage = $scope.pager.foundPages;
		};

		/**
		 * Переход на предыдущую страницу
		 */
		$scope.gotoPrevPage = function()
		{
			if ($scope.pager.currentPage == 1)
				return true;
			$scope.pager.currentPage--;
		};

		// следим за коллекцией отфильтрованных элементов
		$scope.$watchCollection("filtered", function (list){
			$scope.pager.update(list.length);
		});

		/**
		 * Сортировка по колонкам
		 * @param header
		 */
		$scope.orderTableBy = function(header){

			if ($scope.sortMode == 2)
			{
				// это для работы в 2-х режимах ASC и DESC
				if ($scope.order.header == header && $scope.order.direction == false)
				{
					$scope.order.direction = true;
				}
				else
				{
					$scope.order.header = header;
					$scope.order.direction = false;
				}
			}
			if ($scope.sortMode == 3)
			{
				if ($scope.order.header == header && $scope.order.direction == true)
				{
					$scope.order.header = null; // очистка сортировки.
				}
				else if ( $scope.order.header == header )
				{
					$scope.order.direction = true;
				}
				else
				{
					$scope.order.header = header;
					$scope.order.direction = false;
				}
			}

		};
	}])

	.filter("pager", function(){
		return function(items, page, onPage)
		{
			if (items.length <= onPage)
				return items;

			var offset = (page - 1) * onPage;
			return items.slice(offset, offset + onPage);
		};
	})
	/**
	 * Эта директива добавляет данные в таблицу
	 *
	 * Пример:
	 * <div solo-table-data>
	 * [{"id":0,"prefix":"Miss","name":"Alvah Gleason","address":"58707 Ophelia Field\nEast Lorena, LA 89754-9301"}]
	 * </div>
	 */
	.directive("soloTableData", function(){
		return {
			require: "?ngModel",
			restrict: "A",
			link: function (scope, elm, attrs, ngm)
			{
				//elm.hide();
				elm.css({"display" : "none"});

				if (!!attrs.soloTableData) {
					scope.$watch(attrs.soloTableData, function (value){
						if (!scope.isPromise(value)) {
							scope.bindData(value);
						}
					});
				} else {
					var json = angular.fromJson(elm.html());
					scope.bindData(json);
				}
			}
		};
	})
	/**
	 * Эта директива добавляет возможность сортировки колонки
	 * и добавляет в разметку стрелки, указывающие направление сортировки
	 *
	 * Пример:
	 * <tr>
	 *   <th sort-by='id'>Id</th>
	 * </tr>
	 */
	.directive("sortBy", function($compile){
		return {
			require: "?ngModel",
			restrict: "A",
			replace: false,
			template: function(tElement, tAttrs)
			{
				return "<strong class='solo-table-column-cursor' ng-click='orderTableBy(\""+ tAttrs.sortBy +"\")'>" + tElement.html()+ "</strong>";

			},
			link: function (scope, elm, attrs, ngm)
			{
				if (attrs.sortBy)
				{
					elm.append("<span class='solo-column-arrow'></span>");
					scope.tableHeaders[attrs.sortBy] = elm;
				}
			}
		};
	})

	/**
	 * Можно также указать направление сортировки по-умолчанию, возможные значения asc и desc.
	 * Указать можно только у одной колонки.
	 * Пример:
	 * <th sort-flag='name' default-sort="asc">Name</th>
	 */
	.directive("defaultSort", function(){
		return {
			restrict: "A",
			link: function (scope, elm, attrs, ngm)
			{
				if (attrs.sortBy)
				{
					if ("asc" == attrs.defaultSort)
						scope.order.direction = false;

					if ("desc" == attrs.defaultSort)
						scope.order.direction = true;

					scope.order.header = attrs.sortBy;
				}
			}
		}
	})

	/**
	 * Базовая директива
	 *
	 * <solo-table [scope="true|false"] [items-on-page = "15"] [make-sortable]>
	 *     ...
	 * </solo-table>
	 */
	.directive("soloTable", function(){

		var config = {
			require: "?ngModel",
			restrict: "E",
			scope: false,
			controller: "SoloTableCtrl",
			compile: function (elm, attr)
			{
				// scope: true - the directive creates a new child scope that prototypically inherits
				// from the parent scope. If more than one directive (on the same DOM element) requests a new scope,
				// only one new child scope is created. Since we have "normal" prototypal inheritance,
				// this is like ng-include and ng-switch, so be wary of 2-way data binding to parent scope primitives,
				// and child scope hiding/shadowing of parent scope properties.
				if (attr.hasOwnProperty("scope"))
				{
					this.scope = (attr.scope == "true")? true : false;
				}

				var tr = null;
				if (attr.hasOwnProperty("listId"))
				{
					tr = angular.element(document.getElementById(attr.listId));
				}
				else
				{
					tr = angular.element( elm.find('tbody').children('tr')[0]);
				}

				if (tr.length == 0)
					throw Error("Can't find element to repeat");

				var repeat = tr.attr("ng-repeat");

				if (attr.hasOwnProperty("makeSortable"))
				{
					repeat = repeat + " | orderBy:order.header:order.direction";
					tr.attr("ng-repeat", repeat);
				}

				if (attr.hasOwnProperty("itemsOnPage") && attr.itemsOnPage !== 0)
				{
					repeat = repeat + " | pager:pager.currentPage:pager.getOnPage()";
					tr.attr("ng-repeat", repeat);
				}
				return {
					pre: function preLink(scope, element, attr)
					{
						// обработка настройки make-sortable
						if (attr.hasOwnProperty("makeSortable"))
						{
							scope.setSortMode(attr.makeSortable);

							scope.$watchCollection("order", function(){

								var resetClasses = function()
								{
									for (var i in scope.tableHeaders)
									{
										scope.tableHeaders[i].removeClass("solo-table-sort-asc");
										scope.tableHeaders[i].removeClass("solo-table-sort-desc");
									}
								};

								if (scope.order.header == null && scope.order.direction == true)
								{
									resetClasses();
								}
								else if (scope.order.header)
								{
									var el = scope.tableHeaders[scope.order.header];
									if (!el)
										return;
									if (scope.order.direction)
									{
										resetClasses();
										el.addClass("solo-table-sort-asc");
									}
									else
									{
										resetClasses();
										el.addClass("solo-table-sort-desc");
									}
								}

							});
						}

						// обработка настройки items-on-page
						if (attr.hasOwnProperty("itemsOnPage"))
							scope.pager.setOnPage(attr.itemsOnPage);
							//scope.pager.onPage = parseInt(attr.itemsOnPage);
					}
				};
			}
		};
		return config;
	})

	/**
	 * Фильтрация только по указанным полям
	 *
	 * @example <tr ng-repeat="item in filtered = (original | filterByFields:filter:['id', 'login', 'name']">
	 */
	.filter("filterByFields", function(){

		/**
		 * @param items - Список фильтруемых записей
		 * @param search - Искомая подстрока
		 * @param items - список имен полей, по которым идет поиск
		 */
		return function (items, search, fields)
		{
			if (!search)
				return items;

			if (fields.length == 0)
				throw Error("You have to define list of fields");

			search = (''+search).toLowerCase();

			var test = function(el, idx, array)
			{
				var compare = function(val, search)
				{
                    // null hasn't method toString()
                    if ( val == null )
                        return false;
					return val.toString().toLowerCase().indexOf(search) !== -1;
				};

				var result = false;
				var len = fields.length;
				for (var i = 0; i < len; i++)
				{
					if (compare(el[fields[i]], search))
					{
						result = true;
						break;
					}
				}
				return result;
			};

			return items.filter(test);
		};
	});

