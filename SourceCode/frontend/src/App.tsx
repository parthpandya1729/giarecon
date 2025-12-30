import Router from './app/Router'
import ErrorBoundary from './shared/components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <Router />
    </ErrorBoundary>
  )
}

export default App
