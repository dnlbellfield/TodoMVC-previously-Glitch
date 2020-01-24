/*global jQuery, Handlebars, Router */
//jQuery(function ($) {
	'use strict';

	Handlebars.registerHelper('eq', function (a, b, options) {
		return a === b ? options.fn(this) : options.inverse(this);
	});

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;

	var util = {
		uuid: function () {
			/*jshint bitwise:false */
			var i, random;
			var uuid = '';

			for (i = 0; i < 32; i++) {
				random = Math.random() * 16 | 0;
				if (i === 8 || i === 12 || i === 16 || i === 20) {
					uuid += '-';
				}
				uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
			}

			return uuid;
		},
		pluralize: function (count, word) {
			return count === 1 ? word : word + 's';
		},
		store: function (namespace, data) {
			if (arguments.length > 1) {
				return localStorage.setItem(namespace, JSON.stringify(data));
			} else {
				var store = localStorage.getItem(namespace);
				return (store && JSON.parse(store)) || [];
			}
		}
	};

	var App = {
		init: function () {
			this.todos = util.store('todos-jquery');
			//this.todoTemplate = Handlebars.compile($('#todo-template').html());
      this.todoTemplate = Handlebars.compile(document.getElementById('todo-template').innerHTML);
			//this.footerTemplate = Handlebars.compile($('#footer-template').html());
      this.footerTemplate = Handlebars.compile(document.getElementById('footer-template').innerHTML);
			this.bindEvents();

      new Router({
				'/:filter': function (filter) {
					this.filter = filter;
					this.render();
				}.bind(this)
			}).init('/all');      
		},
		bindEvents: function () { //Daniel bind event to HTML element 
      var todoList = document.getElementById('todo-list');
      
			document.getElementById('new-todo').addEventListener('keyup', this.create.bind(this));
			document.getElementById('toggle-all').addEventListener('change', this.toggleAll.bind(this));
			document.getElementById('footer').addEventListener('click', function (event) {
        
       var clearCompletedButton = document.getElementById('clear-completed');
        if (event.target === clearCompletedButton) {
          this.destroyCompleted();
        }
      }.bind(this));
  
			todoList.addEventListener('change', function (event) {
        if (event.target.className === 'toggle') {
          this.toggle(event);
        }
      }.bind(this));
      
      todoList.addEventListener('dblclick', function (event) {
        if (event.target.localName === 'label') {
          this.edit(event);
        }
      }.bind(this));
      
      todoList.addEventListener('keyup', function (event) {
        if (event.target.className === 'edit') {
          this.editKeyup(event);
        }
      }.bind(this));
      
      todoList.addEventListener('focusout', function (event) {
        if (event.target.className === 'edit') {
          this.update(event);
        }
      }.bind(this));
      
       todoList.addEventListener('click', function (event) {
        if (event.target.className === 'destroy') {
          this.destroy(event);
        }
      }.bind(this));
      
      
       // .on('change', '.toggle', this.toggle.bind(this))
				//.on('dblclick', 'label', this.edit.bind(this))
				//.on('keyup', '.edit', this.editKeyup.bind(this))
				//.on('focusout', '.edit', this.update.bind(this))
			//	.on('click', '.destroy', this.destroy.bind(this));
		},
		render: function () {
			var todos = this.getFilteredTodos();
			document.getElementById('todo-list').innerHTML = this.todoTemplate(todos);
			//$('#main').toggle(todos.length > 0);
      if (todos.length > 0) {
        document.getElementById('main').style.display = "block";
      } else {
        document.getElementById('main').style.display = "none";
      };
			document.getElementById('toggle-all').checked = this.getActiveTodos().length === 0;
			this.renderFooter();
			document.getElementById('new-todo').focus();
			util.store('todos-jquery', this.todos);
		},
		renderFooter: function () {
			var todoCount = this.todos.length;
			var activeTodoCount = this.getActiveTodos().length;
			var template = this.footerTemplate({
				activeTodoCount: activeTodoCount,
				activeTodoWord: util.pluralize(activeTodoCount, 'item'),
				completedTodos: todoCount - activeTodoCount,
				filter: this.filter
			});

		//	$('#footer').toggle(todoCount > 0).html(template);
      
      if (todoCount > 0) {
        document.getElementById('footer').innerHTML = template;
        document.getElementById('footer').style.display = "block";
      } else {
        document.getElementById('footer').style.display = "none";
      };
		},
		toggleAll: function (e) {
			var isChecked = e.target.checked;

			this.todos.forEach(function (todo) {
				todo.completed = isChecked;
			});

			this.render();
		},
		getActiveTodos: function () {
			return this.todos.filter(function (todo) {
				return !todo.completed;
			});
		},
		getCompletedTodos: function () {
			return this.todos.filter(function (todo) {
				return todo.completed;
			});
		},
		getFilteredTodos: function () {
			if (this.filter === 'active') {
				return this.getActiveTodos();
			}

			if (this.filter === 'completed') {
				return this.getCompletedTodos();
			}

			return this.todos;
		},
		destroyCompleted: function () {
			this.todos = this.getActiveTodos();
			this.filter = 'all';
			this.render();
		},
		// accepts an element from inside the `.item` div and
		// returns the corresponding index in the `todos` array
		indexFromEl: function (el) {
			var id = el.closest('li').dataset.id;
			var todos = this.todos;
			var i = todos.length;

			while (i--) {
				if (todos[i].id === id) {
					return i;
				}
			}
		},
		create: function (e) {
			var input = e.target;
			var val = input.value.trim();

			if (e.which !== ENTER_KEY || !val) {
				return;
			}

			this.todos.push({
				id: util.uuid(),
				title: val,
				completed: false
			});

			input.value = '';

			this.render();
		},
		toggle: function (e) {
			var i = this.indexFromEl(e.target);
			this.todos[i].completed = !this.todos[i].completed;
			this.render();
		},
		edit: function (e) {
			var ourLi = e.target.closest('li');
      
      ourLi.classList.add('editing');
      
      var input = ourLi.querySelector('.edit');
      
			input.focus();
		},
		editKeyup: function (e) {
      var todo = e.target;
      
			if (e.which === ENTER_KEY) {
				todo.blur();
			}

			if (e.which === ESCAPE_KEY) {
				todo.dataset.abort = true; 
        todo.blur();
			}
		},
		update: function (e) {
			var el = e.target;
			var val = el.value.trim();

			if (!val) {
				this.destroy(e);
				return;
			}

			if (el.dataset.abort) {
				el.dataset.abort = false;
			} else {
				this.todos[this.indexFromEl(el)].title = val;
			}

			this.render();
		},
		destroy: function (e) {
			this.todos.splice(this.indexFromEl(e.target), 1);
			this.render();
		}
	};

	App.init();
//});