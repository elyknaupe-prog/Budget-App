<?php
/**
 * Customizer settings for shop facts that appear on the etched plates:
 * FFL number, address, email, phone, season line. Editable under
 * Appearance → Customize → Shop Details so copy tweaks never require
 * a code change.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function txht_defaults() {
	return array(
		'txht_ffl'     => '5-76-167-07-8K-07838',
		'txht_address' => '166 Loch Lomond Dr, League City, TX 77573',
		'txht_email'   => 'mike@southeasttexasmfg.com',
		'txht_phone'   => '', // Not published yet — client to provide (open question #5).
		'txht_season'  => 'WHITETAIL — GENERAL SEASON',
	);
}

function txht_opt( $key ) {
	$defaults = txht_defaults();
	return get_theme_mod( $key, isset( $defaults[ $key ] ) ? $defaults[ $key ] : '' );
}

function txht_customize_register( $wp_customize ) {
	$wp_customize->add_section(
		'txht_shop_details',
		array(
			'title'    => __( 'Shop Details', 'txht' ),
			'priority' => 30,
		)
	);

	$fields = array(
		'txht_ffl'     => __( 'FFL license number', 'txht' ),
		'txht_address' => __( 'Street address', 'txht' ),
		'txht_email'   => __( 'Contact email', 'txht' ),
		'txht_phone'   => __( 'Phone number (leave blank to hide)', 'txht' ),
		'txht_season'  => __( 'Season line (hero plate)', 'txht' ),
	);

	$defaults = txht_defaults();

	foreach ( $fields as $key => $label ) {
		$wp_customize->add_setting(
			$key,
			array(
				'default'           => $defaults[ $key ],
				'sanitize_callback' => 'sanitize_text_field',
			)
		);
		$wp_customize->add_control(
			$key,
			array(
				'label'   => $label,
				'section' => 'txht_shop_details',
				'type'    => 'text',
			)
		);
	}
}
add_action( 'customize_register', 'txht_customize_register' );
