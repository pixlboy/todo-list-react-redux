'use strict';

//Importing from named exports
import {createStore} from 'redux';
import {combineReducers} from 'redux';
import React from 'react';
import ReactDOM from 'react-dom';
//{provider} provides a context {store} to all children inside it
//Context works at any depth
//Its necessary to pass the context type to match the context key {store}
//A context creates kind of wormhole between Provider and container component
import {Provider} from 'react-redux';
import {connect} from 'react-redux';

//Reducer function (pure function) responsible for updating the state of application
//Any state change will be caused by action dispatch
//Different reducers specify how different parts of the application are updated in response to actions
const todo = (state, action) => {
    switch (action.type){
        case 'ADD_TODO':
            return {
                id: action.id,
                text: action.text,
                completed: false
            }
        case 'TOGGLE_TODO':
            if(state.id !== action.id) {
                return state;
            }
            return {
                ...state,
                completed : !state.completed
            }
        default:
            return state;
    }
};

//Reducer
const visibilityFilter = (state = "SHOW_ALL", action) => {
    switch (action.type){
        case 'SET_VISIBILITY_FILTER':
            return action.filter;
        default:
            return state;
    }
};

//Reducer
const todos = (state = [], action) => {
    switch (action.type){
        case 'ADD_TODO':
            return [
                ...state,
                todo(undefined, action)
            ];
        case 'TOGGLE_TODO':
            return state.map(t => todo(t, action));     //Uses todo reducer to handle individual items
        default:
            return state;
    }
};

//Reducer Combination Pattern (Provided by Redux natively)
//Root reducer calls multiple reducers to manage parts of state tree/store
//Combines their result in a single state object
//Helps scale the redux application; different developers can work on different reducers
const todoApp = combineReducers({
    todos,
    visibilityFilter
});

//Returns todos list based on filter applied
const getVisibleTodos = (todos, filter) => {
    switch(filter) {
        case 'SHOW_ALL':
            return todos;
        case 'SHOW_ACTIVE':
            return todos.filter(
                t => !t.completed
            );
        case 'SHOW_COMPLETED':
            return todos.filter(
                t => t.completed
            );
    }
}

let nextTodoId = 0;
//Presentational Component & Container component - Functional Component
//Context {store} is default 2nd argument, props is 1st
const AddTodo = (props, {store}) => {
    let input;
    return(
        <div>
            <input ref={node =>
                input = node
            } />
            <button onClick={() => {
                store.dispatch({
                    type: 'ADD_TODO',           //This will cause the state change
                    id: nextTodoId++,
                    text : input.value
                })
                input.value = '';
            }}>
                Add Todo
            </button>
        </div>
    );
};

//Its necessary to pass the context type to match the context key {store}
AddTodo.contextTypes = {
    store: React.PropTypes.object
}

//Presentational Component
//ES6 Destructruing in arguments list -> {props} = {onClick, completed, text}
const Todo = ({onClick, completed, text}) => {
    return(
        <li onClick={onClick}
            style={{
                textDecoration : completed ? 'line-through' : 'none'
            }}>
            {text}
        </li>
    )
};

//Presentational Component
const TodoList = ({todos, onTodoClick}) => {
    return(
        <ul>
            {todos.map(todo =>
                <Todo
                    key = {todo.id}
                    {...todo}
                    onClick={() => onTodoClick(todo.id)}
                />
            )}
        </ul>
    )
};

const mapStateToProps = (state) => {
    return {
        todos: getVisibleTodos(
            state.todos,
            state.visibilityFilter
        )
    };
};

const mapDispatchToProps = (state) => {
    return {
        onTodoClick: (id) => {
            store.dispatch({
                type: 'TOGGLE_TODO',           //This will cause the state change
                id
            });
        }
    };
}

//Presentational component
//Chilren prop is passed by default - in this case it is text inside the link
const Link = ({active, children, onClick}) => {
    if(active){
        return <span>{children}</span>
    }
    return(
        <a href="javascript:void(0)"
            onClick = { e => {
                e.preventDefault();
                onClick();
            }}
        >
            {children}
        </a>
    )
};

//Container component - provides data and controls the behaviour of presentational component
class FilterLink extends React.Component{
    componentDidMount() {
        const {store} = this.context;   //receives the context passed through Provider
        this.unsubscribe = store.subscribe(() =>
            this.forceUpdate()
        );
    }

    componentWillMUnmount() {
        this.unsubscribe();
    }

    //Render method will be invoked everytime the state/store changes
    render(){
        const props = this.props;
        const {store} = this.context;   //receives the context passed through Provider
        const state = store.getState();

        return(
            <Link
                active = {
                    props.filter === state.visibilityFilter
                }
                onClick = {() =>
                    store.dispatch({
                        type: 'SET_VISIBILITY_FILTER',           //This will cause the state change
                        filter: props.filter
                    })
                }
            >
                {props.children}
            </Link>
        );
    }
}

//Its necessary to pass the context type to match the context key {store}
FilterLink.contextTypes = {
    store: React.PropTypes.object
}

//Presentational Component - no logic involved
const Footer = () => {
    return(
        <p>
            Show:
            {' '}
            <FilterLink
                filter = 'SHOW_ALL'
            >
                All
            </FilterLink>
            {' '}
            <FilterLink
                filter = 'SHOW_ACTIVE'
            >
                Active
            </FilterLink>
            {' '}
            <FilterLink
                filter = 'SHOW_COMPLETED'
            >
                Completed
            </FilterLink>
        </p>
    );
};

//Connect creates a container component
//Merges the objects and creates bindings
//Called twice because its a curried Function
const VisibleTodoList = connect(
    mapStateToProps,
    mapDispatchToProps
)(TodoList);

//Parent App container {TodoApp} - calls intermediate components {AddTodo, VisibleTodoList, Footer}
//reduces the complexity caused by passing data around the components through props
const TodoApp = () => (
    <div>
        <AddTodo />
        <VisibleTodoList />
        <Footer />
    </div>
);

//Initial call to the render function for displaying the list
//Create a store {store}
//Pass the combined reducer function {todoApp}
//Pass the context {store} as a prop to all child components of {Provider}
ReactDOM.render(
    <Provider store = {createStore(todoApp)}>
        <TodoApp />
    </Provider>,
    document.getElementById('root')
);

//Renders whatever is passed to it {TodoApp} Component
// class Provider extends React.Component {
//     getChildContext() {
//         return {
//             store: this.props.store
//         };
//     }
//
//     render() {
//         return this.props.children;
//     }
// }

//Its necessary to pass the context type to match the context key {store}
// Provider.childContextTypes = {
//     store: React.PropTypes.object
// }
