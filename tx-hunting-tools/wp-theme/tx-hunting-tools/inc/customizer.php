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
		'txht_ffl'             => '5-76-167-07-8K-07838',
		'txht_address'         => '166 Loch Lomond Dr, League City, TX 77573',
		'txht_email'           => 'mike@southeasttexasmfg.com',
		'txht_phone'           => '', // Not published yet — client to provide (open question #5).
		'txht_season'          => 'WHITETAIL — GENERAL SEASON',
		'txht_hero_kicker'     => '07/02 FFL Manufacturer — League City, Texas',
		'txht_caps_kicker'     => 'Capabilities',
		'txht_caps_heading'    => 'The Nameplate',
		'txht_shop_kicker'     => 'Shop',
		'txht_shop_heading'    => 'Gear & Builds',
		'txht_process_kicker'  => 'Custom Work',
		'txht_process_heading' => 'From Consult to Transfer',
		'txht_contact_kicker'  => 'Contact',
		'txht_contact_heading' => 'Come By The Shop',
		'txht_hero_headline'   => 'Machined for the field.',
		'txht_hero_accent'     => 'Built in-house.',
		'txht_hero_sub'        => 'Custom suppressors, firearm work, and precision-machined hunting gear out of our own shop — 5-axis CNC, manual lathes, laser engraving, welding, and 3D printing under one roof. Regulated items transfer through our League City shop; gear ships nationwide.',
		'txht_caps_lede'       => 'Everything we sell is backed by the machines it was made on. No drop-shipped catalog — this is the actual floor.',
		'txht_shop_lede'       => 'Optics, apparel, and field tools ship straight to you. Suppressors and custom firearms are transfer-only — pick up in-shop or arrange an FFL transfer after checkout.',
		'txht_process_lede'    => 'One shop handles the whole build — you talk to the person running the machine.',
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

	$wp_customize->add_section(
		'txht_homepage_text',
		array(
			'title'    => __( 'Homepage Text', 'txht' ),
			'priority' => 31,
		)
	);

	// key => array( label, section, control type )
	$fields = array(
		'txht_ffl'           => array( __( 'FFL license number', 'txht' ), 'txht_shop_details', 'text' ),
		'txht_address'       => array( __( 'Street address', 'txht' ), 'txht_shop_details', 'text' ),
		'txht_email'         => array( __( 'Contact email', 'txht' ), 'txht_shop_details', 'text' ),
		'txht_phone'         => array( __( 'Phone number (leave blank to hide)', 'txht' ), 'txht_shop_details', 'text' ),
		'txht_season'        => array( __( 'Season line (hero plate)', 'txht' ), 'txht_shop_details', 'text' ),
		'txht_hero_kicker'   => array( __( 'Hero kicker (small line above headline)', 'txht' ), 'txht_homepage_text', 'text' ),
		'txht_hero_headline' => array( __( 'Hero headline (white part)', 'txht' ), 'txht_homepage_text', 'text' ),
		'txht_hero_accent'   => array( __( 'Hero headline (brass part)', 'txht' ), 'txht_homepage_text', 'text' ),
		'txht_hero_sub'      => array( __( 'Hero subheadline', 'txht' ), 'txht_homepage_text', 'textarea' ),
		'txht_caps_kicker'   => array( __( 'Capabilities small label', 'txht' ), 'txht_homepage_text', 'text' ),
		'txht_caps_heading'  => array( __( 'Capabilities heading', 'txht' ), 'txht_homepage_text', 'text' ),
		'txht_shop_kicker'   => array( __( 'Shop small label', 'txht' ), 'txht_homepage_text', 'text' ),
		'txht_shop_heading'  => array( __( 'Shop heading', 'txht' ), 'txht_homepage_text', 'text' ),
		'txht_process_kicker'  => array( __( 'Custom Work small label', 'txht' ), 'txht_homepage_text', 'text' ),
		'txht_process_heading' => array( __( 'Custom Work heading', 'txht' ), 'txht_homepage_text', 'text' ),
		'txht_contact_kicker'  => array( __( 'Contact small label', 'txht' ), 'txht_homepage_text', 'text' ),
		'txht_contact_heading' => array( __( 'Contact heading', 'txht' ), 'txht_homepage_text', 'text' ),
		'txht_caps_lede'     => array( __( 'Capabilities section intro', 'txht' ), 'txht_homepage_text', 'textarea' ),
		'txht_shop_lede'     => array( __( 'Shop section intro', 'txht' ), 'txht_homepage_text', 'textarea' ),
		'txht_process_lede'  => array( __( 'Custom Work section intro', 'txht' ), 'txht_homepage_text', 'textarea' ),
	);

	$defaults = txht_defaults();

	foreach ( $fields as $key => $args ) {
		$wp_customize->add_setting(
			$key,
			array(
				'default'           => $defaults[ $key ],
				'sanitize_callback' => 'textarea' === $args[2] ? 'sanitize_textarea_field' : 'sanitize_text_field',
			)
		);
		$wp_customize->add_control(
			$key,
			array(
				'label'   => $args[0],
				'section' => $args[1],
				'type'    => $args[2],
			)
		);
	}
}
add_action( 'customize_register', 'txht_customize_register' );
