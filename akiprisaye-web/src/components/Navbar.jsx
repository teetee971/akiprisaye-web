import { Link, NavLink } from 'react-router-dom';
import { ShoppingCart, Heart, BarChart3 } from 'lucide-react';
import { useCart } from '../store/useCart';

const Item = ({ to, children }) => (
  <NavLink
    to={to}
    className={({isActive}) =>
      `px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 ${isActive?'font-semibold underline':''}`
    }>
    {children}
  </NavLink>
);

export default function Navbar(){
  const total = useCart(state => state.totalQty());
  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/60 dark:bg-neutral-900/60 border-b border-black/5">
      <div className="container flex items-center gap-3 py-3">
        <Link to="/" className="text-xl font-black tracking-tight">A KI PRI SA YÉ</Link>
        <nav className="ml-4 hidden sm:flex items-center gap-1">
          <Item to="/">Accueil</Item>
          <Item to="/produits">Produits</Item>
          <Item to="/favoris">Favoris</Item>
          <Item to="/vie-chere">Vie chère</Item>
          <Item to="/compte">Compte</Item>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/favoris" className="btn" title="Favoris"><Heart size={18}/></Link>
          <Link to="/vie-chere" className="btn" title="Stats"><BarChart3 size={18}/></Link>
          <Link to="/panier" className="btn btn-primary" title="Panier">
            <ShoppingCart size={18} className="mr-2"/>{total()}
          </Link>
        </div>
      </div>
    </header>
  );
}
