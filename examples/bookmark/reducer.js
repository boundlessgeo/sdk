const defaultState = {
  count: 0,
};

export default function bookmarkReducer(state = defaultState, action) {
  switch (action.type) {
    case 'MOVE':
			return Object.assign({}, state, { count: action.count });
  	case 'CHANGESOURCE':
			return { source: action.source, count: 0};
  	case 'ADDBOOKMARK':
    return Object.assign({}, state, { isAdding: action.isAdding });
  	default:
      return state;
  }
}
