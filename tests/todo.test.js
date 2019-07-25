import { Selector } from "testcafe";
import percySnapshot from "../index.js";

// Big thank you to fvitas for putting together this test suite!
// source: https://github.com/fvitas/testcafe-todomvc
class TodoPage {
  constructor() {
    this.input = Selector(".new-todo");
    this.editInput = Selector(".edit");
    this.todoItems = Selector(".todo-list li");
    this.firstTodoItem = Selector(".todo-list li:nth-child(1)");
    this.completedTodos = Selector(".completed");
    this.completeAll = Selector(".toggle-all");
    this.deleteCompleted = Selector(".clear-completed");
    this.showActiveLink = Selector('[href="#/active"]');
    this.showCompletedLink = Selector('[href="#/completed"]');
  }
}

const todoPage = new TodoPage();

fixture("Test TodoMVC App").page("http://todomvc.com/examples/vanillajs/");

test("Create todo", async t => {
  await t
    .typeText(todoPage.input, "write blog post about JS")
    .pressKey("enter");

  await percySnapshot(t, "Created a todo");
  await t.expect(todoPage.todoItems.count).eql(1);

  await t
    .expect(todoPage.firstTodoItem.textContent)
    .contains("write blog post about JS");
});

test("Edit todo", async t => {
  await t
    .typeText(todoPage.input, "write blog post about JS")
    .pressKey("enter");

  await t
    .doubleClick(todoPage.firstTodoItem)
    .selectText(todoPage.editInput, 6)
    .pressKey("backspace")
    .typeText(todoPage.editInput, "something different")
    .pressKey("enter");

  await t
    .expect(todoPage.firstTodoItem.textContent)
    .contains("write something different");

  await percySnapshot(t, "Edited Todo");
});

test("Delete todo", async t => {
  await t
    .typeText(todoPage.input, "write blog post about JS")
    .pressKey("enter")
    .typeText(todoPage.input, "buy some beer")
    .pressKey("enter");

  await t.expect(todoPage.todoItems.count).eql(2);
  await percySnapshot(t, "Delete TODO -- initial");

  await t
    .hover(todoPage.firstTodoItem)
    .click(todoPage.todoItems.nth(0).find(".destroy"));

  await t.expect(todoPage.todoItems.count).eql(1);
  await percySnapshot(t, "Delete TODO -- after");

  await t.expect(todoPage.firstTodoItem.textContent).contains("buy some beer");
});

test("Complete one todo", async t => {
  await t
    .typeText(todoPage.input, "write blog post about JS")
    .pressKey("enter")

    .typeText(todoPage.input, "buy some beer")
    .pressKey("enter");

  await t.click(todoPage.todoItems.nth(0).find(".toggle"));

  await t.expect(todoPage.todoItems.nth(0).hasClass("completed")).ok();
  await percySnapshot(t, "Completed TODO");

  await t.expect(todoPage.todoItems.count).eql(2);
});

test("Show active/completed todos", async t => {
  await t
    .typeText(todoPage.input, "write blog post about JS")
    .pressKey("enter")

    .typeText(todoPage.input, "buy some beer")
    .pressKey("enter");

  await t.click(todoPage.todoItems.nth(0).find(".toggle"));

  await t.expect(todoPage.todoItems.count).eql(2);

  // when click on show active
  await t.click(todoPage.showActiveLink);
  await percySnapshot(t, "Active TODOs");

  await t
    .expect(todoPage.todoItems.nth(0).textContent)
    .contains("buy some beer");

  // when click on show completed
  await t.click(Selector(todoPage.showCompletedLink));

  await t
    .expect(todoPage.firstTodoItem.textContent)
    .contains("write blog post about JS");

  await percySnapshot(t, "Completed TODOs");
});

test("Complete all todos", async t => {
  await t
    .typeText(todoPage.input, "write blog post about JS")
    .pressKey("enter")

    .typeText(todoPage.input, "buy some beer")
    .pressKey("enter")

    .typeText(todoPage.input, "watch a movie")
    .pressKey("enter")

    .typeText(todoPage.input, "go to a meeting")
    .pressKey("enter");

  await t
    .expect(todoPage.todoItems.count)
    .eql(4)
    .expect(todoPage.completedTodos.count)
    .eql(0);

  await t.click(todoPage.completeAll);

  await t.expect(todoPage.completedTodos.count).eql(4);
  await percySnapshot(t, "All TODOs completed");
});

test("Delete all completed todos", async t => {
  let todos = [
    "write blog post about JS",
    "buy some beer",
    "watch a movie",
    "go to a meeting"
  ];

  for (let todo of todos)
    await t.typeText(todoPage.input, todo).pressKey("enter");

  await t.expect(todoPage.todoItems.count).eql(todos.length);

  await t.click(todoPage.completeAll).click(todoPage.deleteCompleted);

  await t.expect(todoPage.todoItems.count).eql(0);
});
