//============================================
// local
//============================================
var local_config_ = {
	current_page: 0,
	load_count:	  10,
};

function _create_line(entry)
{
	const tr_begin  = '<tr>';
	const tr_end	= '</tr>';
	const td_begin  = '<td>';
	const td_end	= '</td>';
	const hidden_td_begin  = '<td style="display:none;">';
	const td_strong_begin  = '<td style="font-size:12pt; color:red; font-weight:bold">';

	return tr_begin +
		td_strong_begin + entry.lot		  + td_end +
		td_begin		+ entry.message	  + td_end +
		td_begin		+ entry.regist_dt + td_end +
		td_begin		+ entry.hash	  + td_end +
		hidden_td_begin	+ entry.id		  + td_end +
	tr_end;
}

function _get_next_entries()
{
	$.ajax({
		type: "GET",
		url: "/lot_list",
		data: "count="	  + local_config_.load_count +
			  "&offset="  + (local_config_.load_count*local_config_.current_page),
		dataType: "json",
		success: function(data){
			for(var i=0; i<data.list.length; ++i) {
				$('#lot_table').append(_create_line(data.list[i]));
			}
			++local_config_.current_page;

			if ( data.list.length < local_config_.load_count ) {
				$("#next_button").css("display", "none");
			}
		},
		error: function(xhr, text_status){
			alert("error");
		}
	});
}

//============================================
// behavior
//============================================

// initialize
$(document).ready(function(){
	$('#message_area_div').addClass('bg-danger');
	$('#lot_accept_button').attr('disabled', true);
	_get_next_entries();
});

// lot_accept_button callback function
$(function(){
	$('#lot_accept_button').click(function(){
		if ( $('#message_area').val().length == 0 ) {
			return;
		}
		
		$.ajax({
			type: "GET",
			url: "/lot",
			data: "message=" + $('#message_area').val(),
			dataType: "json",
			success: function(data){
				$('#lot_table').prepend(_create_line(data));
			},
			error: function(xhr, text_status){
				alert("error");
			}
		});
	});
});

// next_button callback function
$(function(){
	$('#next_button').click(function(){
		_get_next_entries();
	});
});


// message_area validation
$(function(){
	$('#message_area').change(function(){
		if ( $('#message_area').val().length == 0 ) {
			$('#message_area_div').addClass('bg-danger');
			$('#lot_accept_button').attr('disabled', true);
		} else {
			$('#message_area_div').removeClass('bg-danger');
			$('#lot_accept_button').removeAttr('disabled');
		}
	});
});


