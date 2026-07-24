<?php
/**
 * TX Hunting Tools theme setup.
 *
 * Store/cart/checkout is handled by the Ecwid Ecommerce Shopping Cart
 * plugin (embedded storefront). This theme deliberately has no
 * WooCommerce support — do not add it; see docs/SETUP.md in the
 * project repo for the compliance rationale.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'TXHT_VERSION', '1.5.0' );

require get_template_directory() . '/inc/customizer.php';

function txht_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'custom-logo' );
	add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption', 'style', 'script' ) );

	register_nav_menus(
		array(
			'primary' => __( 'Primary (sticky nav)', 'txht' ),
			'footer'  => __( 'Footer (Terms / Privacy / FFL Info)', 'txht' ),
		)
	);
}
add_action( 'after_setup_theme', 'txht_setup' );

function txht_assets() {
	// Oswald (display) / Inter (body) / JetBrains Mono (spec plates).
	wp_enqueue_style(
		'txht-fonts',
		'https://fonts.googleapis.com/css2?family=Oswald:wght@500;600&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;700&display=swap',
		array(),
		null
	);
	wp_enqueue_style( 'txht-style', get_stylesheet_uri(), array( 'txht-fonts' ), TXHT_VERSION );

	// Best-effort Ecwid storefront re-skin; only needed where the store renders.
	if ( function_exists( 'ecwid_get_store_id' ) ) {
		wp_enqueue_style(
			'txht-ecwid-skin',
			get_template_directory_uri() . '/assets/css/ecwid-skin.css',
			array( 'txht-style' ),
			TXHT_VERSION
		);
	}

	wp_enqueue_script( 'txht-nav', get_template_directory_uri() . '/assets/js/nav.js', array(), TXHT_VERSION, true );
}
add_action( 'wp_enqueue_scripts', 'txht_assets' );

function txht_resource_hints( $hints, $relation_type ) {
	if ( 'preconnect' === $relation_type ) {
		$hints[] = array( 'href' => 'https://fonts.gstatic.com', 'crossorigin' => 'anonymous' );
		$hints[] = 'https://fonts.googleapis.com';
	}
	return $hints;
}
add_filter( 'wp_resource_hints', 'txht_resource_hints', 10, 2 );

/**
 * Render the embedded Ecwid storefront, or a plain placeholder until the
 * Ecwid plugin is installed and connected to the client's existing account.
 */
function txht_render_store() {
	if ( function_exists( 'ecwid_get_store_id' ) && shortcode_exists( 'ecwid' ) ) {
		echo do_shortcode( '[ecwid widgets="productbrowser" default_category_id="0"]' );
		return;
	}
	echo '<div class="ecwid-placeholder">STOREFRONT PENDING — install the “Ecwid Ecommerce Shopping Cart” plugin and connect the existing Ecwid account. See docs/SETUP.md.</div>';
}

/**
 * Appointment-request form handler. Emails the request to the shop's
 * contact email (Customizer → Shop Details) and redirects back to the
 * contact section with a success/failure flag.
 */
function txht_handle_booking() {
	if ( ! isset( $_POST['txht_book_nonce'] ) || ! wp_verify_nonce( $_POST['txht_book_nonce'], 'txht_book' ) ) {
		wp_safe_redirect( home_url( '/?booked=0#contact' ) );
		exit;
	}

	// Honeypot: real visitors leave it empty; bots fill it in.
	if ( ! empty( $_POST['txht_website'] ) ) {
		wp_safe_redirect( home_url( '/?booked=1#contact' ) );
		exit;
	}

	$name    = sanitize_text_field( wp_unslash( $_POST['txht_name'] ?? '' ) );
	$phone   = sanitize_text_field( wp_unslash( $_POST['txht_phone'] ?? '' ) );
	$service = sanitize_text_field( wp_unslash( $_POST['txht_service'] ?? '' ) );
	$message = sanitize_textarea_field( wp_unslash( $_POST['txht_message'] ?? '' ) );

	if ( '' === $name || '' === $phone ) {
		wp_safe_redirect( home_url( '/?booked=0#contact' ) );
		exit;
	}

	$body = "Appointment request from the website:\n\n"
		. "Name:    {$name}\n"
		. "Phone:   {$phone}\n"
		. "Needs:   {$service}\n\n"
		. ( $message ? "Details:\n{$message}\n" : '' );

	$sent = wp_mail(
		txht_opt( 'txht_email' ),
		'Appointment request — ' . $name,
		$body
	);

	wp_safe_redirect( home_url( ( $sent ? '/?booked=1' : '/?booked=0' ) . '#contact' ) );
	exit;
}
add_action( 'admin_post_txht_book', 'txht_handle_booking' );
add_action( 'admin_post_nopriv_txht_book', 'txht_handle_booking' );
