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
};

//Action Creators
//For better maintainability
let nextTodoId = 0;
const addTodo = (text) => {
    return {
        type: 'ADD_TODO',           //This will cause the state change
        id: nextTodoId++,
        text: text
    };
};

const toggleTodo = (id) => {
    return {
        type: 'TOGGLE_TODO',           //This will cause the state change
        id
    };
};

const setVisibilityFilter = (filter) => {
    return {
        type: 'SET_VISIBILITY_FILTER',           //This will cause the state change
        filter: filter
    };
};

//Presentational Component & Container component - Functional Component
//Context {store} is default 2nd argument, props is 1st
let AddTodo = ({ dispatch }) => {
    let input;
    return(
        <div>
            <input ref={node =>
                input = node
            } />
            <button onClick={() => {
                dispatch(addTodo(input.value));
                input.value = '';
            }}>
                Add Todo
            </button>
        </div>
    );
};

//Does not require any props, dispatch is passed as 2nd argument by default
//{connect} does not need to subscribe to store
//Second {connect} call (AddTodo) generates a combined container component
AddTodo = connect()(AddTodo);

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

//Input - state of {store}
//Returns - props that need to be passed to presentational child components
//Props are returned anytime the {state} changes
const mapStateToPropsTodo = (state) => {
    return {
        todos: getVisibleTodos(
            state.todos,
            state.visibilityFilter
        )
    };
};

//Input - dispatch method from {store}
//Returns - props that need to be passed to presentational child components
const mapDispatchToPropsTodo = (dispatch) => {
    return {
        onTodoClick: (id) => {
            dispatch(toggleTodo(id));
        }
    };
}

//{connect} creates a container component
//{connect} calculates and merges the objects, creates bindings
//{mapStateToProps}, {mapDispatchToProps} together describe a container component
//Called twice because its a curried Function
const VisibleTodoList = connect(
    mapStateToPropsTodo,
    mapDispatchToPropsTodo
)(TodoList);

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

//Input - state of {store}
//Input - {ownProps} is passed as second parameter (SHOW_ALL, SHOW_ACTIVE, SHOW_COMPLETED)
//Returns - props that need to be passed to presentational child components
//Props are returned anytime the {state} changes
const mapStateToPropsLink = (state, ownProps) => {
    return {
        active: ownProps.filter === state.visibilityFilter
    };
};

//Input - dispatch method from {store}
//Input - {ownProps} is passed as second parameter, container component own props
//Returns - generated props that need to be passed to presentational child components
const mapDispatchToPropsLink = (dispatch, ownProps) => {
    return {
        onClick: () => {
            dispatch(setVisibilityFilter(ownProps.filter));
        }
    };
};

const FilterLink = connect(
    mapStateToPropsLink,
    mapDispatchToPropsLink
)(Link);

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

// Redux provides {Provider} natively, so below code is ommitted

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

// Provider.childContextTypes = {
//     store: React.PropTypes.object
// }

// Redux provides {connect} natively, so below code is ommitted

// class FilterLink extends React.Component{
//     componentDidMount() {
//         const {store} = this.context;   //receives the context passed through Provider
//         this.unsubscribe = store.subscribe(() =>
//             this.forceUpdate()
//         );
//     }
//
//     componentWillMUnmount() {
//         this.unsubscribe();
//     }
//

//     render(){
//         const props = this.props;
//         const {store} = this.context;   //receives the context passed through Provider
//         const state = store.getState();
//
//         return(
//             <Link
//                 active = {
//                     props.filter === state.visibilityFilter
//                 }
//                 onClick = {() =>
//                     store.dispatch({
//                         type: 'SET_VISIBILITY_FILTER',           //This will cause the state change
//                         filter: props.filter
//                     })
//                 }
//             >
//                 {props.children}
//             </Link>
//         );
//     }
// }

// FilterLink.contextTypes = {
//     store: React.PropTypes.object
// }
