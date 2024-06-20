// Sidebar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import "../styles/sidebar.css";

function Sidebar() {
    const location = useLocation();
    const isActive = (pathname) => location.pathname === pathname;

    return (
        <div className="sidebar">
            <img src={require("../assets/images/logo3.png")} alt="Logo" className="sidebar-logo" />
            <Link to="/verVentas" className={isActive("/verVentas") ? 'active' : ''}>Ver Ventas</Link>
            <Link to="/crearVenta" className={isActive("/crearVenta") ? 'active' : ''}>Crear Venta</Link>
            <Link to='/verCompras' className={isActive('/verCompras') ? 'active' : ''}>Ver Compras</Link>
            <Link to='/crearCompra' className={isActive('/crearCompra') ? 'active' : ''}>Crear Compra</Link>
            <Link to='/cuotaCompra' className={isActive('/cuotaCompra') ? 'active' : ''}>Cuota Compra</Link>
            <Link to="/crearProveedor" className={isActive("/crearProveedor") ? 'active' : ''}>Crear Proveedor</Link>
            <Link to="/crearCliente" className={isActive("/crearCliente") ? 'active' : ''}>Crear Cliente</Link>
            {/* Más enlaces si es necesario */}
        </div>
    );
}

export default Sidebar;
