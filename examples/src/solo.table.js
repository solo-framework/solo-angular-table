/**
 * AngularJS table with filters & sorting
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
		 * Описание пейджера
		 *
		 * @type onPage: number, currentPage: number, found: number, total: Number, foundPages: number
		 */
		$scope.pager = {
			onPage: 10,
			currentPage: 1,
			found: 0,
			foundPages: 0
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

		/**
		 * Обновление данных пейджера
		 *
		 * @param filteredCount
		 */
		$scope.updatePager = function(filteredCount)
		{
			$scope.pager.found = filteredCount;
			$scope.pager.foundPages = Math.ceil(filteredCount / $scope.pager.onPage);
			$scope.gotoFirstPage();
		};

		// следим за коллекцией отфильтрованных элементов
		$scope.$watchCollection("filtered", function (list){
			$scope.updatePager(list.length);
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

				var json = angular.fromJson(elm.html());
				scope.bindData(json);
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
	 * Указывает, сколько записей д.б. на странице
	 * Пример: <solo-table items-on-page = "20">
	 */
	.directive("itemsOnPage", function(){
		return {

			restrict: "A",
			compile: function (elm, attr)
			{
				if (attr.itemsOnPage !== 0 && attr.itemsOnPage)
				{
					var tr = angular.element( elm.find('tbody').children('tr')[0]);
					var repeat = tr.attr("ng-repeat");
					tr.attr("ng-repeat", repeat + " | pager:pager.currentPage:pager.onPage");
				}
				return {
					pre: function preLink(scope, element, attrs)
					{
						scope.pager.onPage = parseInt(attrs.itemsOnPage);
					}
				};
			}
		};
	})
	/**
	 * Директива добавляет возможность сортировки - добавляет в ng-repeat фильтр с направлениями сортировки
	 */
	.directive("makeSortable", function(){
		return {
			restrict: "A",
			compile: function (elm, attr)
			{
				// добавим возможность сортировки
				var tr = angular.element( elm.find('tbody').children('tr')[0]);
				var repeat = tr.attr("ng-repeat");
				tr.attr("ng-repeat", repeat + " | orderBy:order.header:order.direction");

				// следим за изменениями сортировки
				return {
					pre: function preLink(scope, elm, attrs)
					{
						scope.setSortMode(attrs.makeSortable);

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
				};
			}
		};
	})
	/**
	 * Базовая директива
	 *
	 * <solo-table [items-on-page = "15"] [make-sortable]>
	 *     ...
	 * </solo-table>
	 */
	.directive("soloTable", function(){
		return {
			require: "?ngModel",
			restrict: "E",
			controller: "SoloTableCtrl"
		};
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

