
const Layout = ({children}) => {
  return (
         <div className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gradient-primary bg-clip-text ">
              MapleCart
            </h1>
            <div className="text-sm text-muted-foreground">
              Secure Checkout
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1  flex-col">
     {children}
      </div>
      
      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Made by Lola Akinrinsola @2025
          </p>
        </div>
      </footer></div>
  )
}

export default Layout