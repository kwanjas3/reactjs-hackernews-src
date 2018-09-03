import React, { Component } from 'react';
//import logo from './logo.svg';
import './App.css';
import 'isomorphic-fetch';
//import PropTypes from 'prop-types';
import { sortBy } from 'lodash';
import classNames from 'classnames';

const DEFAULT_HPP = '100';
//const PATH_BASE = 'https://hn.foo.bar.com/api/v1'; //error testing
const DEFAULT_QUERY = 'redux';
const PATH_BASE = 'https://hn.algolia.com/api/v1';
const PATH_SEARCH = '/search';
const PARAM_SEARCH = 'query=';
const FRONT_PAGE = 'tags=front_page';
const PARAM_PAGE = 'page=';
const PARAM_HPP = 'hitsPerPage=';

const url = `${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${DEFAULT_QUERY}`;
console.log(url)
console.log(`${PATH_BASE}${PATH_SEARCH}?${FRONT_PAGE}`)

// const isSearched = searchTerm => item =>
//   item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//   item.author.toLowerCase().includes(searchTerm.toLowerCase())

const SORTS = {
  NONE: list => list,
  TITLE: list => sortBy(list, 'title'),
  AUTHOR: list => sortBy(list, 'author'),
  COMMENTS: list => sortBy(list, 'num_comments').reverse(),
  POINTS: list => sortBy(list, 'points').reverse(),
};



class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      result: null,
      searchTerm: '',
      searchKey: '',
      error: null,
      isLoading: false,
      sortKey: 'NONE',
      isSortReverse: false,
      count: 0,
    }
    this.needsToSearchTopStories = this.needsToSearchTopStories.bind(this);
    this.setSearchTopStories = this.setSearchTopStories.bind(this);
    this.fetchSearchTopStories = this.fetchSearchTopStories.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onSort = this.onSort.bind(this);
  }

  onSort(sortKey) {
    const isSortReverse = this.state.sortKey === sortKey && !this.state.isSortReverse;
    this.setState({ sortKey, isSortReverse })
  }
  needsToSearchTopStories(searchTerm) {
    return !this.state.results[searchTerm];
  }
  onSearchSubmit(event) {
    const { searchTerm } = this.state;
    this.setState({ searchKey: searchTerm });

    if (this.needsToSearchTopStories(searchTerm)) {
      this.fetchSearchTopStories(searchTerm);
    }
    event.preventDefault();
  }
  setSearchTopStories(result) {
    const { hits, page } = result;

    const { searchKey, results } = this.state;
    const oldHits = results && results[searchKey]
      ? results[searchKey].hits
      : [];

    const updatedHits = [
      ...oldHits,
      ...hits
    ];
    this.setState({
      results: {
        ...results,
        [searchKey]: { hits: updatedHits, page }
      },
      isLoading: false
    });

  }
  fetchSearchTopStories(searchTerm, page = 0) {
    if (searchTerm === '') {
      this.setState({ isLoading: true });
      fetch(`${PATH_BASE}${PATH_SEARCH}?${FRONT_PAGE}&${PARAM_PAGE}${page}`)
        .then(response => response.json())
        .then(result => this.setSearchTopStories(result))
        .catch(e => this.setState({ error: e }));
    } else {
      this.setState({ isLoading: true });
      fetch(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`)
        .then(response => response.json())
        .then(result => this.setSearchTopStories(result))
        .catch(e => this.setState({ error: e }));
    }
  }
  componentDidMount() {
    const { searchTerm } = this.state;
    this.setState({ searchKey: searchTerm });
    this.fetchSearchTopStories(searchTerm);
  }
  onSearchChange(event) {
    this.setState({ searchTerm: event.target.value });
  }
  onDismiss(id) {
    const { searchKey, results } = this.state;
    const { hits, page } = results[searchKey];

    const isNotId = item => item.objectID !== id;
    const updatedHits = hits.filter(isNotId);
    this.setState({
      results: {
        ...results,
        [searchKey]: { hits: updatedHits, page }
      }
    });
  }

  render() {
    const { searchTerm, results, searchKey, error, isLoading, sortKey, isSortReverse } = this.state;
    const page = (
      results &&
      results[searchKey] &&
      results[searchKey].page
    ) || 0;
    const list = (
      results &&
      results[searchKey] &&
      results[searchKey].hits) || [];
    return (
      <div className="page">
        <div className="interactions">
          <ButtonWithLoading
            isLoading={isLoading}
            onClick={() => this.fetchSearchTopStories(searchKey, page + 1)}>
            More
</ButtonWithLoading>
          <Search
            onChange={this.onSearchChange}
            value={searchTerm}
            onSubmit={this.onSearchSubmit}
          >
            Search
        </Search>
        </div>
        {error
          ? <div className="interactions">
            <p>Something went wrong.</p>
          </div>
          : <Table
            list={list}
            onDismiss={this.onDismiss}
            isLoading={isLoading}
            sortKey={sortKey}
            onSort={this.onSort}
            isSortReverse={isSortReverse}
          />
        }

        <div className="interactions">
          <Button onClick={() => this.fetchSearchTopStories(searchKey, page + 1)}>
            More
</Button>
        </div>
      </div >
    );
  }
}



class Search extends Component {
  componentDidMount() {
    if (this.input) {
      this.input.focus();
    }
  }
  render() {
    const { onChange, value, children, onSubmit, } = this.props
    return (
      <form onSubmit={onSubmit}>
        {children + ": "}
        <input type="text"
          onChange={onChange}
          value={value}
          ref={(node) => { this.input = node; }}
        />
      </form>)
  }
}

const Table = ({ list, onDismiss, isLoading, sortKey, onSort, isSortReverse, count }) => {
  const sortedList = SORTS[sortKey](list);
  const reverseSortedList = isSortReverse
    ? sortedList.reverse()
    : sortedList;

  return (
    <div className="table">
      {!isLoading ?
        <div className="table-header">
          <span style={{ width: '40%' }}>
            <Sort
              sortKey={'TITLE'}
              onSort={onSort}
              activeSortKey={sortKey}
            >
            Title 
            
            </Sort>
            {" "}{sortKey != 'TITLE' ? null:<i className={isSortReverse? 'up':'down'}> </i>}

          </span>
          <span style={{ width: '30%' }}>
            <Sort
              sortKey={'AUTHOR'}
              onSort={onSort}
              activeSortKey={sortKey}
            >
              Author
          </Sort>
          {" "}{sortKey != 'AUTHOR' ? null:<i className={isSortReverse? 'up':'down'}> </i>}

          </span>
          <span style={{ width: '10%' }}>
            <Sort
              sortKey={'COMMENTS'}
              onSort={onSort}
              activeSortKey={sortKey}
            >
              Comments
</Sort>
{" "}{sortKey != 'COMMENTS' ? null:<i className={isSortReverse? 'up':'down'}> </i>}

          </span>
          <span style={{ width: '10%' }}>
            <Sort
              sortKey={'POINTS'}
              onSort={onSort}
              activeSortKey={sortKey}
            >
              Points
</Sort>
{" "}{sortKey != 'POINTS' ? null:<i className={isSortReverse? 'up':'down'}> </i>}

          </span>
          <span style={{ width: '10%' }}>
            Archive
</span>
        </div>
        : <Loading />}
      {reverseSortedList.map(item =>
        <div key={item.objectID} className="table-row">
          <span style={{ width: '40%' }}>
            <a href={item.url}>{item.title}</a>
          </span>
          <span style={{ width: '30%' }}>{item.author}</span>
          <span style={{ width: '10%' }}>{item.num_comments}</span>
          <span style={{ width: '10%' }}>{item.points}</span>
          <span style={{ width: '10%' }}>
            <Button className="button-inline"
              onClick={() => onDismiss(item.objectID)}
              type="button"
            >
              Dismiss
</Button>
          </span>
        </div>
      )}
    </div>)
}

const Button = ({ onClick, className = '', children }) =>
  <button
    className={className}
    onClick={onClick}
    type="button"
  >
    {children}
  </button>

const Loading = () =>
  <div><i className="fas fa-spinner"></i></div>

const withLoading = (Component) => ({ isLoading, ...rest }) =>
  isLoading
    ? <Loading />
    : <Component {...rest} />

const ButtonWithLoading = withLoading(Button);

const Sort = ({
  sortKey,
  activeSortKey,
  onSort,
  isSortReverse,
  children,
}) => {
  const sortClass = classNames(
    'button-inline',
    { 'button-active': sortKey === activeSortKey }
  );
  return (
    <Button
      className={sortClass}
      onClick={(event) => { onSort(sortKey); }}
    >
      {children + " "}
    </Button>
  );
}


export default App;