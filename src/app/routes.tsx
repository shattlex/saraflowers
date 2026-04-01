import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Delivery } from './pages/Delivery';
import { Contacts } from './pages/Contacts';
import { BouquetBuilder } from './pages/BouquetBuilder';
import { Account } from './pages/Account';
import { Favorites } from './pages/Favorites';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: 'catalog',
        element: <Catalog />
      },
      {
        path: 'product/:id',
        element: <ProductDetail />
      },
      {
        path: 'cart',
        element: <Cart />
      },
      {
        path: 'checkout',
        element: <Checkout />
      },
      {
        path: 'delivery',
        element: <Delivery />
      },
      {
        path: 'contacts',
        element: <Contacts />
      },
      {
        path: 'bouquet-builder',
        element: <BouquetBuilder />
      },
      {
        path: 'account',
        element: <Account />
      },
      {
        path: 'favorites',
        element: <Favorites />
      }
    ]
  }
]);
