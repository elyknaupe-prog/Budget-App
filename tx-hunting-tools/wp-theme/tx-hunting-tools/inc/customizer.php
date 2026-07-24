<?php
/**
 * Customizer settings — every piece of homepage text, plus button labels
 * and destinations, is editable under Appearance → Customize:
 *
 *   Shop Details      — FFL number, address, email, phone, season line
 *   Homepage Text     — hero copy, section labels/headings/intros, shop note
 *   Buttons & Links   — hero CTAs and the nav "Book Appointment" button
 *   Capabilities Grid — all six tiles (tag, title, description, spec line)
 *   Custom Work Steps — all four steps (title, description)
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function txht_defaults() {
	return array(
		// Shop Details.
		'txht_ffl'             => '5-76-167-07-8K-07838',
		'txht_address'         => '166 Loch Lomond Dr, League City, TX 77573',
		'txht_email'           => 'mike@southeasttexasmfg.com',
		'txht_phone'           => '', // Not published yet — client to provide (open question #5).
		'txht_season'          => 'WHITETAIL — GENERAL SEASON',
		'txht_plate_location'  => 'League City, TX',
		'txht_plate_floor'     => 'CNC · LATHE · LASER · WELD',

		// Homepage Text.
		'txht_hero_kicker'     => '07/02 FFL Manufacturer — League City, Texas',
		'txht_hero_headline'   => 'Machined for the field.',
		'txht_hero_accent'     => 'Built in-house.',
		'txht_hero_sub'        => 'Custom suppressors, firearm work, and precision-machined hunting gear out of our own shop — 5-axis CNC, manual lathes, laser engraving, welding, and 3D printing under one roof. Regulated items transfer through our League City shop; gear ships nationwide.',
		'txht_caps_kicker'     => 'Capabilities',
		'txht_caps_heading'    => 'The Nameplate',
		'txht_caps_lede'       => 'Everything we sell is backed by the machines it was made on. No drop-shipped catalog — this is the actual floor.',
		'txht_shop_kicker'     => 'Shop',
		'txht_shop_heading'    => 'Gear & Builds',
		'txht_shop_lede'       => 'Optics, apparel, and field tools ship straight to you. Suppressors and custom firearms are transfer-only — pick up in-shop or arrange an FFL transfer after checkout.',
		'txht_shop_note_label' => 'Transfer Only',
		'txht_shop_note_text'  => 'Regulated items (suppressors, firearms) do not ship direct. Fulfillment is in-store pickup or FFL transfer — details on each product page.',
		'txht_process_kicker'  => 'Custom Work',
		'txht_process_heading' => 'From Consult to Transfer',
		'txht_process_lede'    => 'One shop handles the whole build — you talk to the person running the machine.',
		'txht_contact_kicker'  => 'Contact',
		'txht_contact_heading' => 'Come By The Shop',

		// Shop page (separate /shop/ page template).
		'txht_shoppage_kicker'  => 'Shop',
		'txht_shoppage_heading' => 'The Store',
		'txht_shoppage_tagline' => 'Make your next hunt silent. Suppressors, gunsmith work, optic & slide cuts, muzzle devices, and gear — machined and finished in-house.',

		// Buttons & Links.
		'txht_cta1_label'      => 'Shop Now',
		'txht_cta1_url'        => '/shop/',
		'txht_cta2_label'      => 'Start a Custom Build',
		'txht_cta2_url'        => '#custom-work',
		'txht_nav_cta_label'   => 'Book Appointment',
		'txht_nav_cta_url'     => '#contact',
		'txht_shop_btn_label'  => 'Browse the Full Store',
		'txht_shop_btn_url'    => '/shop/',

		// Capabilities Grid (6 tiles × tag/title/description/spec).
		'txht_cap1_idx'        => '01 / CNC',
		'txht_cap1_title'      => '5-Axis CNC Milling',
		'txht_cap1_desc'       => 'Baffle stacks, tube bodies, receivers, and one-off fixtures cut from billet.',
		'txht_cap1_spec'       => '5-AXIS · ALUMINUM / TI / STAINLESS',
		'txht_cap2_idx'        => '02 / LATHE',
		'txht_cap2_title'      => 'Manual Lathe Work',
		'txht_cap2_desc'       => 'Barrel threading, muzzle-device fitment, chamber and crown work.',
		'txht_cap2_spec'       => 'THREADING · TURNING · FITMENT',
		'txht_cap3_idx'        => '03 / LASER',
		'txht_cap3_title'      => 'Laser Engraving',
		'txht_cap3_desc'       => 'ATF-compliant maker marks, serials, and custom graphics on metal.',
		'txht_cap3_spec'       => 'FORM 1 / FORM 2 MARKING',
		'txht_cap4_idx'        => '04 / WELD',
		'txht_cap4_title'      => 'Welding',
		'txht_cap4_desc'       => 'TIG work on fixtures, brackets, blinds, and field-equipment repair.',
		'txht_cap4_spec'       => 'TIG · STEEL / ALUMINUM',
		'txht_cap5_idx'        => '05 / PRINT',
		'txht_cap5_title'      => '3D Printing',
		'txht_cap5_desc'       => 'Rapid prototyping for grips, guards, and custom-build mockups before metal.',
		'txht_cap5_spec'       => 'PROTOTYPE → PRODUCTION',
		'txht_cap6_idx'        => '06 / FFL',
		'txht_cap6_title'      => 'FFL Transfers',
		'txht_cap6_desc'       => 'In-shop transfers and NFA item handling under our 07/02 license.',
		'txht_cap6_spec'       => '5-76-167-07-8K-07838',

		// Custom Work Steps.
		'txht_step1_title'     => 'Consult',
		'txht_step1_desc'      => 'Tell us the platform, use case, and constraints. We scope it honestly.',
		'txht_step2_title'     => 'Design',
		'txht_step2_desc'      => 'CAD and prototype passes — 3D-printed mockups before any metal is cut.',
		'txht_step3_title'     => 'Machine',
		'txht_step3_desc'      => 'Cut, welded, engraved, and finished in-house on our own equipment.',
		'txht_step4_title'     => 'Transfer',
		'txht_step4_desc'      => 'Regulated builds complete through compliant in-shop transfer and paperwork.',
	);
}

function txht_opt( $key ) {
	$defaults = txht_defaults();
	return get_theme_mod( $key, isset( $defaults[ $key ] ) ? $defaults[ $key ] : '' );
}

function txht_customize_register( $wp_customize ) {
	$sections = array(
		'txht_shop_details'  => __( 'Shop Details', 'txht' ),
		'txht_homepage_text' => __( 'Homepage Text', 'txht' ),
		'txht_buttons'       => __( 'Buttons & Links', 'txht' ),
		'txht_caps_grid'     => __( 'Capabilities Grid', 'txht' ),
		'txht_steps'         => __( 'Custom Work Steps', 'txht' ),
	);
	$priority = 30;
	foreach ( $sections as $id => $title ) {
		$wp_customize->add_section( $id, array( 'title' => $title, 'priority' => $priority++ ) );
	}

	// key => array( label, section, control type ).
	$fields = array(
		'txht_ffl'             => array( __( 'FFL license number', 'txht' ), 'txht_shop_details', 'text' ),
		'txht_address'         => array( __( 'Street address', 'txht' ), 'txht_shop_details', 'text' ),
		'txht_email'           => array( __( 'Contact email', 'txht' ), 'txht_shop_details', 'text' ),
		'txht_phone'           => array( __( 'Phone number (leave blank to hide)', 'txht' ), 'txht_shop_details', 'text' ),
		'txht_season'          => array( __( 'Season line (hero plate)', 'txht' ), 'txht_shop_details', 'text' ),
		'txht_plate_location'  => array( __( 'Location line (hero plate)', 'txht' ), 'txht_shop_details', 'text' ),
		'txht_plate_floor'     => array( __( 'Shop floor line (hero plate)', 'txht' ), 'txht_shop_details', 'text' ),

		'txht_hero_kicker'     => array( __( 'Hero kicker (small line above headline)', 'txht' ), 'txht_homepage_text', 'text' ),
		'txht_hero_headline'   => array( __( 'Hero headline (white part)', 'txht' ), 'txht_homepage_text', 'text' ),
		'txht_hero_accent'     => array( __( 'Hero headline (brass part)', 'txht' ), 'txht_homepage_text', 'text' ),
		'txht_hero_sub'        => array( __( 'Hero subheadline', 'txht' ), 'txht_homepage_text', 'textarea' ),
		'txht_caps_kicker'     => array( __( 'Capabilities small label', 'txht' ), 'txht_homepage_text', 'text' ),
		'txht_caps_heading'    => array( __( 'Capabilities heading', 'txht' ), 'txht_homepage_text', 'text' ),
		'txht_caps_lede'       => array( __( 'Capabilities intro', 'txht' ), 'txht_homepage_text', 'textarea' ),
		'txht_shop_kicker'     => array( __( 'Shop small label', 'txht' ), 'txht_homepage_text', 'text' ),
		'txht_shop_heading'    => array( __( 'Shop heading', 'txht' ), 'txht_homepage_text', 'text' ),
		'txht_shop_lede'       => array( __( 'Shop intro', 'txht' ), 'txht_homepage_text', 'textarea' ),
		'txht_shop_note_label' => array( __( 'Shop notice label (red)', 'txht' ), 'txht_homepage_text', 'text' ),
		'txht_shop_note_text'  => array( __( 'Shop notice text', 'txht' ), 'txht_homepage_text', 'textarea' ),
		'txht_process_kicker'  => array( __( 'Custom Work small label', 'txht' ), 'txht_homepage_text', 'text' ),
		'txht_process_heading' => array( __( 'Custom Work heading', 'txht' ), 'txht_homepage_text', 'text' ),
		'txht_process_lede'    => array( __( 'Custom Work intro', 'txht' ), 'txht_homepage_text', 'textarea' ),
		'txht_contact_kicker'  => array( __( 'Contact small label', 'txht' ), 'txht_homepage_text', 'text' ),
		'txht_contact_heading' => array( __( 'Contact heading', 'txht' ), 'txht_homepage_text', 'text' ),

		'txht_shoppage_kicker'  => array( __( 'Shop page — small label', 'txht' ), 'txht_homepage_text', 'text' ),
		'txht_shoppage_heading' => array( __( 'Shop page — heading', 'txht' ), 'txht_homepage_text', 'text' ),
		'txht_shoppage_tagline' => array( __( 'Shop page — intro line', 'txht' ), 'txht_homepage_text', 'textarea' ),

		'txht_cta1_label'      => array( __( 'Hero button 1 — label', 'txht' ), 'txht_buttons', 'text' ),
		'txht_cta1_url'        => array( __( 'Hero button 1 — link (e.g. #shop or a full URL)', 'txht' ), 'txht_buttons', 'text' ),
		'txht_cta2_label'      => array( __( 'Hero button 2 — label', 'txht' ), 'txht_buttons', 'text' ),
		'txht_cta2_url'        => array( __( 'Hero button 2 — link', 'txht' ), 'txht_buttons', 'text' ),
		'txht_nav_cta_label'   => array( __( 'Nav button — label', 'txht' ), 'txht_buttons', 'text' ),
		'txht_nav_cta_url'     => array( __( 'Nav button — link', 'txht' ), 'txht_buttons', 'text' ),
		'txht_shop_btn_label'  => array( __( 'Homepage shop button — label', 'txht' ), 'txht_buttons', 'text' ),
		'txht_shop_btn_url'    => array( __( 'Homepage shop button — link', 'txht' ), 'txht_buttons', 'text' ),
	);

	for ( $i = 1; $i <= 6; $i++ ) {
		/* translators: %d: tile number. */
		$fields[ "txht_cap{$i}_idx" ]   = array( sprintf( __( 'Tile %d — corner tag', 'txht' ), $i ), 'txht_caps_grid', 'text' );
		$fields[ "txht_cap{$i}_title" ] = array( sprintf( __( 'Tile %d — title', 'txht' ), $i ), 'txht_caps_grid', 'text' );
		$fields[ "txht_cap{$i}_desc" ]  = array( sprintf( __( 'Tile %d — description', 'txht' ), $i ), 'txht_caps_grid', 'textarea' );
		$fields[ "txht_cap{$i}_spec" ]  = array( sprintf( __( 'Tile %d — spec line (bottom)', 'txht' ), $i ), 'txht_caps_grid', 'text' );
	}

	for ( $i = 1; $i <= 4; $i++ ) {
		/* translators: %d: step number. */
		$fields[ "txht_step{$i}_title" ] = array( sprintf( __( 'Step %d — title', 'txht' ), $i ), 'txht_steps', 'text' );
		$fields[ "txht_step{$i}_desc" ]  = array( sprintf( __( 'Step %d — description', 'txht' ), $i ), 'txht_steps', 'textarea' );
	}

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
